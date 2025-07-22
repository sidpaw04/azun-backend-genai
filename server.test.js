// server.test.js
const request = require('supertest');
const { mockReset } = require('jest-mock-extended');

// Mock the entire @google-cloud/firestore module
jest.mock('@google-cloud/firestore', () => {
  const mockFirestore = {
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    get: jest.fn(),
    set: jest.fn(),
  };
  return {
    Firestore: jest.fn(() => mockFirestore),
  };
});

// Mock the @google/generative-ai module
jest.mock('@google/generative-ai', () => {
  const mockModel = {
    generateContent: jest.fn(),
  };
  const mockGenAI = {
    getGenerativeModel: jest.fn(() => mockModel),
  };
  return {
    GoogleGenerativeAI: jest.fn(() => mockGenAI),
  };
});

// Mock the config module to control behavior (e.g., cache duration)
jest.mock('./src/config', () => ({
  geminiApiKey: 'mock-api-key',
  contentCacheDurationHours: 1, // Set to 1 hour for easier testing of stale cache
  minConfidenceForRegen: 0.6,
  geminiModel: 'gemini-1.5-flash-latest',
}));


// Import the app AFTER all mocks are defined
const app = require('./src/app');

// Get the actual mocked instances that are used by the app
// These are the instances created by the mocked constructors
const { Firestore } = require('@google-cloud/firestore');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const mockFirestoreInstance = new Firestore();
const mockGenAIInstance = new GoogleGenerativeAI();
const mockModelInstance = mockGenAIInstance.getGenerativeModel();


describe('Learning API', () => {
  beforeEach(() => {
    // Reset all mocks before each test to ensure test isolation
    mockReset(mockFirestoreInstance.collection);
    mockReset(mockFirestoreInstance.doc);
    mockReset(mockFirestoreInstance.get);
    mockReset(mockFirestoreInstance.set);
    mockReset(mockGenAIInstance.getGenerativeModel);
    mockReset(mockModelInstance.generateContent);

    // Re-establish chaining mocks after reset
    mockFirestoreInstance.collection.mockReturnThis();
    mockFirestoreInstance.doc.mockReturnThis();

    // Set a default mock for generateContent to avoid "not a function" errors
    // during tests that might not explicitly set their own AI response
    mockModelInstance.generateContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify([{ question: "Default Test Question", options: ["A", "B"], answer: "A" }]),
      },
    });
  });

  // --- Helper for common POST body data ---
  const commonPostBody = {
    title: "Test Topic",
    description: "A description for the test topic.",
    level: "B1",
    id: "test-topic-id", // This will be the topicId and Firestore document ID
  };

  // --- Helper to create mock cached content structure from Firestore ---
  const createMockCachedContent = (content, generatedAt, confidenceScore = 1.0) => ({
    content: content,
    _metadata: {
      generatedAt: generatedAt,
      confidenceScore: confidenceScore,
      topicId: commonPostBody.id,
      level: commonPostBody.level,
      title: commonPostBody.title,
      description: commonPostBody.description,
    },
  });

  // --- Test Suite for /api/learn/quiz ---
  describe('/api/learn/quiz', () => {
    const quizContentType = 'quiz';
    const quizCollectionName = 'quizzes';
    const mockQuizContent = [{ question: "What is 'Hallo'?", options: ["Hello", "Goodbye", "Yes", "No"], answer: "Hello" }];

    describe('POST /api/learn/quiz', () => {
      it('should generate and store a new quiz if not cached', async () => {
        // Mock Firestore to indicate no document exists
        mockFirestoreInstance.get.mockResolvedValue({ exists: false });

        // Mock Gemini API response for a new quiz
        mockModelInstance.generateContent.mockResolvedValue({
          response: {
            text: () => JSON.stringify(mockQuizContent),
          },
        });

        const res = await request(app)
          .post(`/api/learn/${quizContentType}`)
          .send(commonPostBody)
          .expect(200);

        // Assert response body
        expect(res.body[quizContentType]).toEqual(mockQuizContent);
        // Assert Firestore interactions
        expect(mockFirestoreInstance.collection).toHaveBeenCalledWith(quizCollectionName);
        expect(mockFirestoreInstance.doc).toHaveBeenCalledWith(commonPostBody.id);
        expect(mockFirestoreInstance.set).toHaveBeenCalledTimes(1);
        // Assert AI interaction
        expect(mockModelInstance.generateContent).toHaveBeenCalledTimes(1);
      });

      it('should return cached quiz if fresh', async () => {
        // Mock a timestamp that is within the fresh duration (e.g., 30 minutes ago, less than 1 hour cache duration)
        const freshTimestamp = new Date(Date.now() - 1000 * 60 * 30).toISOString();
        const cachedData = createMockCachedContent(mockQuizContent, freshTimestamp);
        // Mock Firestore to return existing fresh data
        mockFirestoreInstance.get.mockResolvedValue({ exists: true, data: () => cachedData });

        const res = await request(app)
          .post(`/api/learn/${quizContentType}`)
          .send(commonPostBody)
          .expect(200);

        expect(res.body[quizContentType]).toEqual(mockQuizContent);
        expect(mockFirestoreInstance.get).toHaveBeenCalledTimes(1);
        expect(mockFirestoreInstance.set).not.toHaveBeenCalled(); // Should NOT write to Firestore
        expect(mockModelInstance.generateContent).not.toHaveBeenCalled(); // Should NOT call AI
      });

      it('should regenerate quiz if stale', async () => {
        // Mock a timestamp that is older than the cache duration (e.g., 2 hours ago, more than 1 hour cache duration)
        const staleTimestamp = new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString();
        const cachedData = createMockCachedContent(mockQuizContent, staleTimestamp);
        mockFirestoreInstance.get.mockResolvedValue({ exists: true, data: () => cachedData });

        // Mock new AI response for regeneration
        const newQuizContent = [{ question: "New Regenerated Q", options: ["X", "Y", "Z", "W"], answer: "X" }];
        mockModelInstance.generateContent.mockResolvedValue({
          response: {
            text: () => JSON.stringify(newQuizContent),
          },
        });

        const res = await request(app)
          .post(`/api/learn/${quizContentType}`)
          .send(commonPostBody)
          .expect(200);

        expect(res.body[quizContentType]).toEqual(newQuizContent);
        expect(mockFirestoreInstance.get).toHaveBeenCalledTimes(1);
        expect(mockFirestoreInstance.set).toHaveBeenCalledTimes(1); // Should write the new quiz to Firestore
        expect(mockModelInstance.generateContent).toHaveBeenCalledTimes(1); // Should call AI
      });

      it('should regenerate quiz if confidence is low', async () => {
        // Mock a fresh timestamp but with low confidence score
        const freshTimestamp = new Date().toISOString();
        const lowConfidenceData = createMockCachedContent(mockQuizContent, freshTimestamp, 0.5); // Low confidence
        mockFirestoreInstance.get.mockResolvedValue({ exists: true, data: () => lowConfidenceData });

        const newQuizContent = [{ question: "Regen due to Confidence Q", options: ["C", "D", "E", "F"], answer: "C" }];
        mockModelInstance.generateContent.mockResolvedValue({
          response: {
            text: () => JSON.stringify(newQuizContent),
          },
        });

        const res = await request(app)
          .post(`/api/learn/${quizContentType}`)
          .send({ ...commonPostBody, confidence: 0.5 }) // Send low confidence from frontend
          .expect(200);

        expect(res.body[quizContentType]).toEqual(newQuizContent);
        expect(mockFirestoreInstance.get).toHaveBeenCalledTimes(1);
        expect(mockFirestoreInstance.set).toHaveBeenCalledTimes(1);
        expect(mockModelInstance.generateContent).toHaveBeenCalledTimes(1);
      });

      it('should return 400 if required parameters are missing', async () => {
        await request(app)
          .post(`/api/learn/${quizContentType}`)
          .send({ title: "Missing Desc" }) // Missing description and id
          .expect(400, { success: false, error: 'title, description, and topicId are required' });
      });

      it('should return 500 if AI API fails and no cache is available', async () => {
        mockFirestoreInstance.get.mockResolvedValue({ exists: false }); // No cache
        mockModelInstance.generateContent.mockRejectedValue(new Error('AI service error')); // Simulate AI failure

        const res = await request(app)
          .post(`/api/learn/${quizContentType}`)
          .send(commonPostBody)
          .expect(500);

        expect(res.body.error).toContain('Failed to generate content from AI service.');
        expect(mockFirestoreInstance.set).not.toHaveBeenCalled(); // Should not attempt to save
      });

      it('should return 500 if AI returns invalid JSON and no cache is available', async () => {
        mockFirestoreInstance.get.mockResolvedValue({ exists: false }); // No cache
        mockModelInstance.generateContent.mockResolvedValue({
          response: {
            text: () => 'This is not valid JSON', // Invalid JSON from AI
          },
        });

        const res = await request(app)
          .post(`/api/learn/${quizContentType}`)
          .send(commonPostBody)
          .expect(500);

        expect(res.body.error).toContain('Invalid JSON format from AI');
        expect(mockFirestoreInstance.set).not.toHaveBeenCalled();
      });

      it('should return 200 with warning if API fails but stale cache is available', async () => {
        const staleTimestamp = new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(); // 2 hours ago
        const cachedData = createMockCachedContent(mockQuizContent, staleTimestamp);
        mockFirestoreInstance.get.mockResolvedValue({ exists: true, data: () => cachedData });
        mockModelInstance.generateContent.mockRejectedValue(new Error('AI service error')); // AI fails

        const res = await request(app)
          .post(`/api/learn/${quizContentType}`)
          .send(commonPostBody)
          .expect(200); // Still 200 because it serves stale data

        expect(res.body[quizContentType]).toEqual(mockQuizContent);
        expect(res.body.warning).toContain('API call failed, served stale data.');
        expect(mockFirestoreInstance.set).not.toHaveBeenCalled(); // Should not write new data
        expect(mockModelInstance.generateContent).toHaveBeenCalledTimes(1); // Still tried to call AI
      });
    });

    describe('GET /api/learn/quiz/:topicId', () => {
      it('should return a quiz by topicId', async () => {
        const cachedData = createMockCachedContent(mockQuizContent, new Date().toISOString());
        mockFirestoreInstance.get.mockResolvedValue({ exists: true, data: () => cachedData });

        const res = await request(app)
          .get(`/api/learn/${quizContentType}/${commonPostBody.id}`)
          .expect(200);

        expect(res.body[quizContentType]).toEqual(mockQuizContent);
        expect(mockFirestoreInstance.collection).toHaveBeenCalledWith(quizCollectionName);
        expect(mockFirestoreInstance.doc).toHaveBeenCalledWith(commonPostBody.id);
        expect(mockFirestoreInstance.get).toHaveBeenCalledTimes(1);
      });

      it('should return 404 if quiz not found', async () => {
        mockFirestoreInstance.get.mockResolvedValue({ exists: false });

        await request(app)
          .get(`/api/learn/${quizContentType}/non-existent-id`)
          .expect(404, { success: false, error: 'Quiz not found' });
      });
    });
  });

  // --- Test Suite for /api/learn/exercise ---
  describe('/api/learn/exercise', () => {
    const exerciseContentType = 'exercise';
    const exerciseCollectionName = 'exercises';
    const mockExerciseContent = [{ type: "fill-in-the-blanks", instruction: "Fill it", content: "Der Hund ist ___.", solution: "groß" }];

    describe('POST /api/learn/exercise', () => {
      it('should generate and store a new exercise if not cached', async () => {
        mockFirestoreInstance.get.mockResolvedValue({ exists: false });
        mockModelInstance.generateContent.mockResolvedValue({
          response: {
            text: () => JSON.stringify(mockExerciseContent),
          },
        });

        const res = await request(app)
          .post(`/api/learn/${exerciseContentType}`)
          .send(commonPostBody)
          .expect(200);

        expect(res.body[exerciseContentType]).toEqual(mockExerciseContent);
        expect(mockFirestoreInstance.collection).toHaveBeenCalledWith(exerciseCollectionName);
        expect(mockFirestoreInstance.doc).toHaveBeenCalledWith(commonPostBody.id);
        expect(mockFirestoreInstance.set).toHaveBeenCalledTimes(1);
        expect(mockModelInstance.generateContent).toHaveBeenCalledTimes(1);
      });

      it('should return cached exercise if fresh', async () => {
        const freshTimestamp = new Date(Date.now() - 1000 * 60 * 30).toISOString();
        const cachedData = createMockCachedContent(mockExerciseContent, freshTimestamp);
        mockFirestoreInstance.get.mockResolvedValue({ exists: true, data: () => cachedData });

        const res = await request(app)
          .post(`/api/learn/${exerciseContentType}`)
          .send(commonPostBody)
          .expect(200);

        expect(res.body[exerciseContentType]).toEqual(mockExerciseContent);
        expect(mockFirestoreInstance.get).toHaveBeenCalledTimes(1);
        expect(mockFirestoreInstance.set).not.toHaveBeenCalled();
        expect(mockModelInstance.generateContent).not.toHaveBeenCalled();
      });

      it('should regenerate exercise if stale', async () => {
        const staleTimestamp = new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString();
        const cachedData = createMockCachedContent(mockExerciseContent, staleTimestamp);
        mockFirestoreInstance.get.mockResolvedValue({ exists: true, data: () => cachedData });

        const newExerciseContent = [{ type: "translation", instruction: "Translate", content: "Hello", solution: "Hallo" }];
        mockModelInstance.generateContent.mockResolvedValue({
          response: {
            text: () => JSON.stringify(newExerciseContent),
          },
        });

        const res = await request(app)
          .post(`/api/learn/${exerciseContentType}`)
          .send(commonPostBody)
          .expect(200);

        expect(res.body[exerciseContentType]).toEqual(newExerciseContent);
        expect(mockFirestoreInstance.get).toHaveBeenCalledTimes(1);
        expect(mockFirestoreInstance.set).toHaveBeenCalledTimes(1);
        expect(mockModelInstance.generateContent).toHaveBeenCalledTimes(1);
      });

      it('should return 400 if required parameters are missing', async () => {
        await request(app)
          .post(`/api/learn/${exerciseContentType}`)
          .send({ title: "Missing Desc" })
          .expect(400, { success: false, error: 'title, description, and topicId are required' });
      });

      it('should return 500 if AI API fails and no cache is available', async () => {
        mockFirestoreInstance.get.mockResolvedValue({ exists: false });
        mockModelInstance.generateContent.mockRejectedValue(new Error('AI service error'));

        const res = await request(app)
          .post(`/api/learn/${exerciseContentType}`)
          .send(commonPostBody)
          .expect(500);

        expect(res.body.error).toContain('Failed to generate content from AI service.');
      });
    });

    describe('GET /api/learn/exercise/:topicId', () => {
      it('should return an exercise by topicId', async () => {
        const cachedData = createMockCachedContent(mockExerciseContent, new Date().toISOString());
        mockFirestoreInstance.get.mockResolvedValue({ exists: true, data: () => cachedData });

        const res = await request(app)
          .get(`/api/learn/${exerciseContentType}/${commonPostBody.id}`)
          .expect(200);

        expect(res.body[exerciseContentType]).toEqual(mockExerciseContent);
      });

      it('should return 404 if exercise not found', async () => {
        mockFirestoreInstance.get.mockResolvedValue({ exists: false });

        await request(app)
          .get(`/api/learn/${exerciseContentType}/non-existent-id`)
          .expect(404, { success: false, error: 'Exercise not found' });
      });
    });
  });

  // --- Test Suite for /api/learn/study ---
  describe('/api/learn/study', () => {
    const studyContentType = 'study';
    const studyCollectionName = 'studies';
    const mockStudyContent = { summary: "German greetings", keyConcepts: ["Hallo", "Guten Tag"], examples: ["Hallo, wie geht's?"], tips: ["Practice daily"] };

    describe('POST /api/learn/study', () => {
      it('should generate and store new study material if not cached', async () => {
        mockFirestoreInstance.get.mockResolvedValue({ exists: false });
        mockModelInstance.generateContent.mockResolvedValue({
          response: {
            text: () => JSON.stringify(mockStudyContent),
          },
        });

        const res = await request(app)
          .post(`/api/learn/${studyContentType}`)
          .send(commonPostBody)
          .expect(200);

        expect(res.body[studyContentType]).toEqual(mockStudyContent);
        expect(mockFirestoreInstance.collection).toHaveBeenCalledWith(studyCollectionName);
        expect(mockFirestoreInstance.doc).toHaveBeenCalledWith(commonPostBody.id);
        expect(mockFirestoreInstance.set).toHaveBeenCalledTimes(1);
        expect(mockModelInstance.generateContent).toHaveBeenCalledTimes(1);
      });

      it('should return cached study material if fresh', async () => {
        const freshTimestamp = new Date(Date.now() - 1000 * 60 * 30).toISOString();
        const cachedData = createMockCachedContent(mockStudyContent, freshTimestamp);
        mockFirestoreInstance.get.mockResolvedValue({ exists: true, data: () => cachedData });

        const res = await request(app)
          .post(`/api/learn/${studyContentType}`)
          .send(commonPostBody)
          .expect(200);

        expect(res.body[studyContentType]).toEqual(mockStudyContent);
        expect(mockFirestoreInstance.get).toHaveBeenCalledTimes(1);
        expect(mockFirestoreInstance.set).not.toHaveBeenCalled();
        expect(mockModelInstance.generateContent).not.toHaveBeenCalled();
      });

      it('should regenerate study material if stale', async () => {
        const staleTimestamp = new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString();
        const cachedData = createMockCachedContent(mockStudyContent, staleTimestamp);
        mockFirestoreInstance.get.mockResolvedValue({ exists: true, data: () => cachedData });

        const newStudyContent = { summary: "New Summary", keyConcepts: ["New A", "New B"], examples: ["New Ex1"], tips: ["New Tip1"] };
        mockModelInstance.generateContent.mockResolvedValue({
          response: {
            text: () => JSON.stringify(newStudyContent),
          },
        });

        const res = await request(app)
          .post(`/api/learn/${studyContentType}`)
          .send(commonPostBody)
          .expect(200);

        expect(res.body[studyContentType]).toEqual(newStudyContent);
        expect(mockFirestoreInstance.get).toHaveBeenCalledTimes(1);
        expect(mockFirestoreInstance.set).toHaveBeenCalledTimes(1);
        expect(mockModelInstance.generateContent).toHaveBeenCalledTimes(1);
      });

      it('should return 400 if required parameters are missing', async () => {
        await request(app)
          .post(`/api/learn/${studyContentType}`)
          .send({ title: "Missing Desc" })
          .expect(400, { success: false, error: 'title, description, and topicId are required' });
      });

      it('should return 500 if AI API fails and no cache is available', async () => {
        mockFirestoreInstance.get.mockResolvedValue({ exists: false });
        mockModelInstance.generateContent.mockRejectedValue(new Error('AI service error'));

        const res = await request(app)
          .post(`/api/learn/${studyContentType}`)
          .send(commonPostBody)
          .expect(500);

        expect(res.body.error).toContain('Failed to generate content from AI service.');
      });
    });

    describe('GET /api/learn/study/:topicId', () => {
      it('should return study material by topicId', async () => {
        const cachedData = createMockCachedContent(mockStudyContent, new Date().toISOString());
        mockFirestoreInstance.get.mockResolvedValue({ exists: true, data: () => cachedData });

        const res = await request(app)
          .get(`/api/learn/${studyContentType}/${commonPostBody.id}`)
          .expect(200);

        expect(res.body[studyContentType]).toEqual(mockStudyContent);
      });

      it('should return 404 if study material not found', async () => {
        mockFirestoreInstance.get.mockResolvedValue({ exists: false });

        await request(app)
          .get(`/api/learn/${studyContentType}/non-existent-id`)
          .expect(404, { success: false, error: 'Study material not found' });
      });
    });
  });
});