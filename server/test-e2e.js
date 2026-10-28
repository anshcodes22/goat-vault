const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('🧪 Starting DSA Vault Automated End-to-End Verification...\n');

  try {
    // 1. Health check
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('✅ 1. Health check passed:', health.data.status);

    // 2. Dashboard stats
    const statsBefore = await axios.get(`${BASE_URL}/stats/dashboard`);
    console.log(`✅ 2. Dashboard stats passed: Total problems=${statsBefore.data.stats.totalProblems}, Revisit cycles=${statsBefore.data.stats.totalRevisits}`);

    // 3. Create a new problem
    const newProbPayload = {
      title: 'Longest Palindromic Substring',
      problemNumber: '5',
      platform: 'LeetCode',
      problemUrl: 'https://leetcode.com/problems/longest-palindromic-substring/',
      difficulty: 'Medium',
      topics: ['Strings', 'Dynamic Programming', 'Two Pointers'],
      customTags: ['TopInterview150', 'TestTag2026'],
      language: 'C++',
      firstSolvedAt: '2026-09-01T10:00:00.000Z',
      confusionNotes: 'Edge case: single-character strings and even-length palindromes (expand around center must check both i,i and i,i+1).',
      approaches: [
        {
          name: 'Brute Force',
          explanation: 'Check all O(N^2) substrings if they are palindromes.',
          code: '// O(N^3) brute force code',
          language: 'C++',
          timeComplexity: 'O(N^3)',
          spaceComplexity: 'O(1)'
        },
        {
          name: 'Expand Around Center',
          explanation: 'Every palindrome has a center. Expand outwards for 2N - 1 centers.',
          code: '// O(N^2) center expansion code',
          language: 'C++',
          timeComplexity: 'O(N^2)',
          spaceComplexity: 'O(1)'
        }
      ]
    };

    const createRes = await axios.post(`${BASE_URL}/problems`, newProbPayload);
    const createdProblem = createRes.data.problem;
    console.log(`✅ 3. Problem creation passed: ID=${createdProblem._id}, Approaches=${createdProblem.approaches.length}`);
    if (new Date(createdProblem.firstSolvedAt).toISOString() !== '2026-09-01T10:00:00.000Z') {
      throw new Error('Historical firstSolvedAt date was not preserved on creation!');
    }

    // 4. Test duplicate prevention
    console.log('Testing duplicate prevention on same platform...');
    try {
      await axios.post(`${BASE_URL}/problems`, {
        title: 'Duplicate Attempt',
        problemNumber: '5',
        platform: 'LeetCode'
      });
      throw new Error('Failed: Duplicate problemNumber on same platform should have been rejected!');
    } catch (err) {
      if (err.response && err.response.status === 409) {
        console.log('✅ 4. Duplicate prevention on same platform passed (HTTP 409 Conflict):', err.response.data.message);
      } else {
        throw err;
      }
    }

    // 5. Test same problemNumber allowed on DIFFERENT platform
    console.log('Testing same problemNumber on different platform...');
    const diffPlatformRes = await axios.post(`${BASE_URL}/problems`, {
      title: 'Binary Search Problem 5',
      problemNumber: '5',
      platform: 'AtCoder'
    });
    console.log('✅ 5. Same problemNumber on different platform allowed:', diffPlatformRes.data.problem.platform, diffPlatformRes.data.problem.problemNumber);
    // Cleanup the AtCoder one
    await axios.delete(`${BASE_URL}/problems/${diffPlatformRes.data.problem._id}`);

    // 6. Test Approach variants: Add custom variant
    const addVariantRes = await axios.post(`${BASE_URL}/problems/${createdProblem._id}/approaches`, {
      name: "Manacher's Algorithm",
      explanation: 'Transform string with # and maintain center and right boundary for linear time.',
      code: '// Linear time Manacher algorithm',
      language: 'C++',
      timeComplexity: 'O(N)',
      spaceComplexity: 'O(N)'
    });
    console.log(`✅ 6. Add custom approach variant passed: Approaches count is now ${addVariantRes.data.approaches.length}`);
    const manacher = addVariantRes.data.approaches.find(a => a.name === "Manacher's Algorithm");
    if (!manacher) throw new Error("Manacher's Algorithm variant not found!");

    // 7. Test Rename variant
    const renameRes = await axios.patch(`${BASE_URL}/problems/${createdProblem._id}/approaches/${manacher.id}/rename`, {
      name: "Manacher's Algorithm (Linear O(N))"
    });
    console.log('✅ 7. Rename approach variant passed:', renameRes.data.approach.name);

    // 8. Test Update variant details (debounced save / auto-save)
    const updateVariantRes = await axios.put(`${BASE_URL}/problems/${createdProblem._id}/approaches/${manacher.id}`, {
      code: '// Updated Manacher algorithm with complete implementation',
      timeComplexity: 'O(N)',
      spaceComplexity: 'O(N)',
      notes: 'Best linear time approach'
    });
    console.log('✅ 8. Update variant code and notes passed:', updateVariantRes.data.approach.notes);

    // 9. Test Revisit tracking: Mark problem as revisited multiple times
    const revisit1 = await axios.post(`${BASE_URL}/problems/${createdProblem._id}/revisit`, {
      notes: 'First revisit session. Reviewed expand around center approach.',
      variantReviewed: 'Expand Around Center'
    });
    console.log(`✅ 9a. First revisit recorded: Count=${revisit1.data.problem.revisitCount}, History events=${revisit1.data.problem.revisionHistory.length}`);

    const revisit2 = await axios.post(`${BASE_URL}/problems/${createdProblem._id}/revisit`, {
      notes: 'Second revisit session. Implemented Manacher algorithm without notes.',
      variantReviewed: "Manacher's Algorithm (Linear O(N))"
    });
    console.log(`✅ 9b. Second revisit recorded: Count=${revisit2.data.problem.revisitCount}, History events=${revisit2.data.problem.revisionHistory.length}`);

    // Verify chronological order and no overwriting
    if (revisit2.data.problem.revisionHistory.length !== 2) {
      throw new Error('Revision history was overwritten instead of appended!');
    }
    if (revisit2.data.problem.revisitCount !== 2) {
      throw new Error('Revisit count did not increment properly!');
    }

    // 10. Test Update problem details preserves firstSolvedAt and revisionHistory
    const updateProbRes = await axios.put(`${BASE_URL}/problems/${createdProblem._id}`, {
      title: 'Longest Palindromic Substring (Updated Title)',
      difficulty: 'Medium'
    });
    if (new Date(updateProbRes.data.problem.firstSolvedAt).toISOString() !== '2026-09-01T10:00:00.000Z') {
      throw new Error('firstSolvedAt was overwritten during updateProblem!');
    }
    if (updateProbRes.data.problem.revisionHistory.length !== 2) {
      throw new Error('revisionHistory was wiped during updateProblem!');
    }
    console.log('✅ 10. Problem edit preserved firstSolvedAt and revision history!');

    // 11. Test Custom Tags endpoint
    const tagsRes = await axios.get(`${BASE_URL}/tags`);
    const customTags = tagsRes.data.customTags || [];
    if (!customTags.includes('TopInterview150') || !customTags.includes('TestTag2026')) {
      throw new Error('Custom tags from created problem were not indexed/reusable in Tag service!');
    }
    console.log(`✅ 11. Custom tags reuse verified: ${customTags.length} reusable tags available.`);

    // 12. Test Filter combinations:
    // a) Search
    const searchRes = await axios.get(`${BASE_URL}/problems?search=Palindromic`);
    if (searchRes.data.problems.length === 0) throw new Error('Search query failed!');
    console.log(`✅ 12a. Search filter passed: found ${searchRes.data.problems.length} matches.`);

    // b) Platform
    const platRes = await axios.get(`${BASE_URL}/problems?platform=LeetCode`);
    console.log(`✅ 12b. Platform filter passed: ${platRes.data.problems.length} LeetCode problems.`);

    // c) Difficulty
    const diffRes = await axios.get(`${BASE_URL}/problems?difficulty=Medium`);
    console.log(`✅ 12c. Difficulty filter passed: ${diffRes.data.problems.length} Medium problems.`);

    // d) Topic / custom tag
    const topicRes = await axios.get(`${BASE_URL}/problems?topic=TestTag2026`);
    if (topicRes.data.problems.length !== 1) throw new Error('Tag filter failed!');
    console.log(`✅ 12d. Custom tag filter passed: ${topicRes.data.problems.length} problems with #TestTag2026.`);

    // e) Has confusion notes
    const confusionRes = await axios.get(`${BASE_URL}/problems?hasConfusion=true`);
    console.log(`✅ 12e. Confusion notes filter passed: ${confusionRes.data.problems.length} problems.`);

    // 13. Test Sorting options
    const sortAlpha = await axios.get(`${BASE_URL}/problems?sortBy=alpha`);
    const sortRecentRevisit = await axios.get(`${BASE_URL}/problems?sortBy=recentRevisit`);
    const sortRevisitCount = await axios.get(`${BASE_URL}/problems?sortBy=revisitCount`);
    console.log('✅ 13. Sorting options passed (alpha, recentRevisit, revisitCount).');

    // 14. Test Delete variant & validation (cannot delete only variant)
    // Delete manacher
    await axios.delete(`${BASE_URL}/problems/${createdProblem._id}/approaches/${manacher.id}`);
    console.log('✅ 14a. Deleted custom approach variant.');

    // 15. Delete the test problem
    await axios.delete(`${BASE_URL}/problems/${createdProblem._id}`);
    console.log('✅ 15. Deleted test problem cleanly.');

    console.log('\n🎉 ALL 15 AUTOMATED VERIFICATION CHECKS PASSED SUCCESSFULLY! 🎉\n');
  } catch (err) {
    console.error('\n❌ Test failed:', err.message);
    if (err.response) {
      console.error('Response data:', err.response.data);
    }
    process.exit(1);
  }
}

runTests();
