const mongoose = require('mongoose');
const dotenv = require('dotenv');
const crypto = require('crypto');

dotenv.config();

const Problem = require('./models/Problem');
const { Tag, PREDEFINED_TOPICS } = require('./models/Tag');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dsa_vault');
    console.log('Connected to MongoDB for seeding...');

    // Clear existing problems
    await Problem.deleteMany({});
    console.log('Cleared existing problems.');

    // Seed tags
    for (const name of PREDEFINED_TOPICS) {
      await Tag.findOneAndUpdate(
        { name },
        { name, category: 'predefined' },
        { upsert: true, returnDocument: 'after' }
      );
    }
    await Tag.findOneAndUpdate(
      { name: 'Blind75' },
      { name: 'Blind75', category: 'custom' },
      { upsert: true, returnDocument: 'after' }
    );
    await Tag.findOneAndUpdate(
      { name: 'NeetCode150' },
      { name: 'NeetCode150', category: 'custom' },
      { upsert: true, returnDocument: 'after' }
    );
    await Tag.findOneAndUpdate(
      { name: 'StriverSDE' },
      { name: 'StriverSDE', category: 'custom' },
      { upsert: true, returnDocument: 'after' }
    );

    const now = new Date();
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
    const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const twentyDaysAgo = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000);

    const sampleProblems = [
      {
        title: 'Two Sum',
        problemNumber: '1',
        platform: 'LeetCode',
        customPlatformName: '',
        problemUrl: 'https://leetcode.com/problems/two-sum/',
        difficulty: 'Easy',
        topics: ['Arrays', 'Hashing'],
        customTags: ['Blind75', 'NeetCode150'],
        language: 'C++',
        confusionNotes: `• What confused me: I initially thought sorting first and using two pointers would be O(N), but sorting itself takes O(N log N) and loses original indices!
• Why initial idea failed: Needed original indices, so sorting required storing (val, index) pairs.
• Edge cases: Duplicate values (e.g. [3, 3] with target 6) - must handle carefully with hash map by checking complement before inserting or checking that the complement's index != current index.
• Remember: Single-pass hash map check-then-insert handles duplicate numbers effortlessly.`,
        firstSolvedAt: twentyDaysAgo,
        lastRevisitedAt: threeDaysAgo,
        revisitCount: 2,
        approaches: [
          {
            id: crypto.randomUUID(),
            name: 'Brute Force',
            explanation: `Examine every possible pair of elements in the array using two nested loops.
For each element at index i, iterate through all elements at index j > i and check if nums[i] + nums[j] == target.

Pros:
- Very simple to implement
- O(1) auxiliary space

Cons:
- O(N^2) time complexity, will TLE for large inputs.`,
            code: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        int n = nums.size();
        for (int i = 0; i < n; ++i) {
            for (int j = i + 1; j < n; ++j) {
                if (nums[i] + nums[j] == target) {
                    return {i, j};
                }
            }
        }
        return {};
    }
};`,
            language: 'C++',
            timeComplexity: 'O(N^2)',
            spaceComplexity: 'O(1)',
            notes: 'Simple nested loops. Check i != j.'
          },
          {
            id: crypto.randomUUID(),
            name: 'Better',
            explanation: `Sort a copy of the array along with original indices. Then use Two Pointers starting from the left and right ends:
- If sum == target, return indices.
- If sum < target, left++
- If sum > target, right--

Complexity:
- Time: O(N log N) due to sorting.
- Space: O(N) to store pair<value, index>.`,
            code: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        vector<pair<int, int>> indexedNums;
        for (int i = 0; i < (int)nums.size(); ++i) {
            indexedNums.push_back({nums[i], i});
        }
        sort(indexedNums.begin(), indexedNums.end());
        
        int left = 0, right = indexedNums.size() - 1;
        while (left < right) {
            int sum = indexedNums[left].first + indexedNums[right].first;
            if (sum == target) {
                return {indexedNums[left].second, indexedNums[right].second};
            } else if (sum < target) {
                left++;
            } else {
                right--;
            }
        }
        return {};
    }
};`,
            language: 'C++',
            timeComplexity: 'O(N log N)',
            spaceComplexity: 'O(N)',
            notes: 'Useful if problem asked for values rather than indices.'
          },
          {
            id: crypto.randomUUID(),
            name: 'Optimal',
            explanation: `Use an unordered_map (hash table) to map element values to their indices.
Iterate through the array once:
For each element x at index i:
1. Calculate complement = target - x.
2. Check if complement exists in the map.
3. If it does, we found the pair: return {map[complement], i}.
4. Otherwise, record x and its index i into the map.

This guarantees single-pass O(N) time and O(N) space.`,
            code: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> seen;
        for (int i = 0; i < (int)nums.size(); ++i) {
            int complement = target - nums[i];
            if (seen.find(complement) != seen.end()) {
                return {seen[complement], i};
            }
            seen[nums[i]] = i;
        }
        return {};
    }
};`,
            language: 'C++',
            timeComplexity: 'O(N)',
            spaceComplexity: 'O(N)',
            notes: 'Optimal single-pass hash map solution.'
          }
        ],
        revisionHistory: [
          {
            id: crypto.randomUUID(),
            timestamp: tenDaysAgo,
            notes: 'First revision: re-implemented hash map solution without looking. Got it on first try in 3 mins.',
            variantReviewed: 'Optimal'
          },
          {
            id: crypto.randomUUID(),
            timestamp: threeDaysAgo,
            notes: 'Reviewed two-pointer approach vs hash map tradeoffs.',
            variantReviewed: 'Better'
          }
        ]
      },
      {
        title: 'Maximum Subarray (Kadane’s Algorithm)',
        problemNumber: '53',
        platform: 'LeetCode',
        customPlatformName: '',
        problemUrl: 'https://leetcode.com/problems/maximum-subarray/',
        difficulty: 'Medium',
        topics: ['Arrays', 'Dynamic Programming', 'Prefix Sums'],
        customTags: ['Blind75', 'StriverSDE'],
        language: 'C++',
        confusionNotes: `• What confused me: What if all numbers in the array are negative? (e.g. [-5, -2, -8])
• Why initial idea failed: Initializing max_sum = 0 gave 0 for all-negative arrays, which was wrong.
• Remember: Initialize max_sum to nums[0] (or INT_MIN) and current_sum to 0. Reset current_sum to 0 when it drops below 0 AFTER comparing with max_sum.`,
        firstSolvedAt: fifteenDaysAgo,
        lastRevisitedAt: tenDaysAgo,
        revisitCount: 1,
        approaches: [
          {
            id: crypto.randomUUID(),
            name: 'Brute Force',
            explanation: `Consider every subarray [i..j]. Calculate the sum of elements from i to j, and update maximum found.
Three nested loops: outer i, middle j, inner loop calculates sum.`,
            code: `class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        int n = nums.size();
        int max_sum = INT_MIN;
        for (int i = 0; i < n; ++i) {
            for (int j = i; j < n; ++j) {
                int sum = 0;
                for (int k = i; k <= j; ++k) sum += nums[k];
                max_sum = max(max_sum, sum);
            }
        }
        return max_sum;
    }
};`,
            language: 'C++',
            timeComplexity: 'O(N^3)',
            spaceComplexity: 'O(1)',
            notes: 'Naive O(N^3) approach'
          },
          {
            id: crypto.randomUUID(),
            name: 'Better',
            explanation: `Improve Brute Force by maintaining running sum in the second loop instead of recomputing from scratch with a third loop.
This reduces time complexity to O(N^2).`,
            code: `class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        int n = nums.size();
        int max_sum = INT_MIN;
        for (int i = 0; i < n; ++i) {
            int current_sum = 0;
            for (int j = i; j < n; ++j) {
                current_sum += nums[j];
                max_sum = max(max_sum, current_sum);
            }
        }
        return max_sum;
    }
};`,
            language: 'C++',
            timeComplexity: 'O(N^2)',
            spaceComplexity: 'O(1)',
            notes: 'Cumulative sum across subarray endpoints.'
          },
          {
            id: crypto.randomUUID(),
            name: 'Optimal',
            explanation: `Kadane's Algorithm:
Maintain two variables: current_sum and max_sum.
For each element x in nums:
- current_sum += x
- max_sum = max(max_sum, current_sum)
- If current_sum < 0, reset current_sum = 0 (a negative prefix will never contribute positively to any subsequent subarray).

Edge Case: Works even if all numbers are negative because max_sum is updated before resetting current_sum to 0.`,
            code: `class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        int max_sum = nums[0];
        int current_sum = 0;
        
        for (int x : nums) {
            current_sum += x;
            max_sum = max(max_sum, current_sum);
            if (current_sum < 0) {
                current_sum = 0;
            }
        }
        return max_sum;
    }
};`,
            language: 'C++',
            timeComplexity: 'O(N)',
            spaceComplexity: 'O(1)',
            notes: 'Classic Kadane algorithm. One pass.'
          }
        ],
        revisionHistory: [
          {
            id: crypto.randomUUID(),
            timestamp: tenDaysAgo,
            notes: 'Checked all-negative array edge case. Confirmed Kadane logic.',
            variantReviewed: 'Optimal'
          }
        ]
      },
      {
        title: 'Trapping Rain Water',
        problemNumber: '42',
        platform: 'TakeUForward',
        customPlatformName: '',
        problemUrl: 'https://takeuforward.org/data-structure/trapping-rainwater/',
        difficulty: 'Hard',
        topics: ['Arrays', 'Two Pointers', 'Monotonic Stack'],
        customTags: ['Blind75', 'StriverSDE'],
        language: 'C++',
        confusionNotes: `• What confused me: The two-pointer condition height[left] <= height[right]. Why do we only care about leftMax if height[left] <= height[right]?
• Why it works: If height[left] <= height[right], we know there exists some boundary on the right that is at least height[left] (specifically height[right]), so the water trapped at 'left' is strictly bounded by leftMax, regardless of whatever larger pillars exist further to the right!
• Edge cases: Arrays of size < 3 cannot trap any water.`,
        firstSolvedAt: twentyDaysAgo,
        lastRevisitedAt: null,
        revisitCount: 0,
        approaches: [
          {
            id: crypto.randomUUID(),
            name: 'Brute Force',
            explanation: `For every index i, the water trapped above it is given by:
water[i] = max(0, min(max_left, max_right) - height[i])
Where max_left is the highest bar to the left of i, and max_right is the highest bar to the right of i.
For each i, scan left to find max_left and right to find max_right.`,
            code: `int trap(vector<int>& height) {
    int n = height.size();
    int water = 0;
    for (int i = 0; i < n; ++i) {
        int max_left = 0, max_right = 0;
        for (int j = i; j >= 0; --j) max_left = max(max_left, height[j]);
        for (int j = i; j < n; ++j) max_right = max(max_right, height[j]);
        water += min(max_left, max_right) - height[i];
    }
    return water;
}`,
            language: 'C++',
            timeComplexity: 'O(N^2)',
            spaceComplexity: 'O(1)',
            notes: 'O(N^2) scan for each index'
          },
          {
            id: crypto.randomUUID(),
            name: 'Better',
            explanation: `Precompute prefix max and suffix max arrays:
- prefix[i] stores the maximum height from 0 to i.
- suffix[i] stores the maximum height from i to n-1.
Then in a single pass:
water += min(prefix[i], suffix[i]) - height[i].`,
            code: `int trap(vector<int>& height) {
    int n = height.size();
    if (n <= 2) return 0;
    vector<int> prefix(n), suffix(n);
    prefix[0] = height[0];
    for (int i = 1; i < n; ++i) prefix[i] = max(prefix[i-1], height[i]);
    suffix[n-1] = height[n-1];
    for (int i = n - 2; i >= 0; --i) suffix[i] = max(suffix[i+1], height[i]);

    int water = 0;
    for (int i = 0; i < n; ++i) {
        water += min(prefix[i], suffix[i]) - height[i];
    }
    return water;
}`,
            language: 'C++',
            timeComplexity: 'O(N)',
            spaceComplexity: 'O(N)',
            notes: 'Precomputed prefix and suffix max arrays'
          },
          {
            id: crypto.randomUUID(),
            name: 'Optimal',
            explanation: `Two-Pointers Approach:
Pointers left = 0, right = n - 1.
leftMax = 0, rightMax = 0.
While left <= right:
- If height[left] <= height[right]:
  If height[left] >= leftMax: update leftMax
  Else: water += leftMax - height[left]
  left++
- Else:
  If height[right] >= rightMax: update rightMax
  Else: water += rightMax - height[right]
  right--

Space is reduced from O(N) to O(1)!`,
            code: `class Solution {
public:
    int trap(vector<int>& height) {
        int n = height.size();
        int left = 0, right = n - 1;
        int leftMax = 0, rightMax = 0;
        int totalWater = 0;

        while (left <= right) {
            if (height[left] <= height[right]) {
                if (height[left] >= leftMax) {
                    leftMax = height[left];
                } else {
                    totalWater += leftMax - height[left];
                }
                left++;
            } else {
                if (height[right] >= rightMax) {
                    rightMax = height[right];
                } else {
                    totalWater += rightMax - height[right];
                }
                right--;
            }
        }
        return totalWater;
    }
};`,
            language: 'C++',
            timeComplexity: 'O(N)',
            spaceComplexity: 'O(1)',
            notes: 'Two pointer O(1) space optimal'
          }
        ],
        revisionHistory: []
      },
      {
        title: 'Coin Combinations I',
        problemNumber: '1635',
        platform: 'CSES',
        customPlatformName: '',
        problemUrl: 'https://cses.fi/problemset/task/1635',
        difficulty: 'Medium',
        topics: ['Dynamic Programming'],
        customTags: ['CSES-DP'],
        language: 'C++',
        confusionNotes: `• What confused me: Difference between Coin Combinations I (permutations matter, e.g. 2+1 is distinct from 1+2) vs Coin Combinations II (order doesn't matter).
• In Coin Combinations I, the outer loop is over target sum x, and inner loop is over coin values!
• Modulo arithmetic: (dp[i] + dp[i - c]) % 1000000007.`,
        firstSolvedAt: fifteenDaysAgo,
        lastRevisitedAt: null,
        revisitCount: 0,
        approaches: [
          {
            id: crypto.randomUUID(),
            name: 'Optimal',
            explanation: `State: dp[i] = number of distinct ordered coin sequences that sum to i.
Base case: dp[0] = 1 (empty sequence).
Transition:
For sum i from 1 to x:
  For each coin c in coins:
    if i - c >= 0:
      dp[i] = (dp[i] + dp[i - c]) % MOD`,
            code: `#include <bits/stdc++.h>
using namespace std;

const int MOD = 1e9 + 7;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n, x;
    if (!(cin >> n >> x)) return 0;

    vector<int> coins(n);
    for (int i = 0; i < n; ++i) cin >> coins[i];

    vector<int> dp(x + 1, 0);
    dp[0] = 1;

    for (int i = 1; i <= x; ++i) {
        for (int c : coins) {
            if (i - c >= 0) {
                dp[i] = (dp[i] + dp[i - c]) % MOD;
            }
        }
    }

    cout << dp[x] << "\n";
    return 0;
}`,
            language: 'C++',
            timeComplexity: 'O(N * X)',
            spaceComplexity: 'O(X)',
            notes: 'Ordered permutations DP'
          }
        ],
        revisionHistory: []
      },
      {
        title: 'Watermelon',
        problemNumber: '4A',
        platform: 'Codeforces',
        customPlatformName: '',
        problemUrl: 'https://codeforces.com/problemset/problem/4/A',
        difficulty: 'Easy',
        topics: ['Math'],
        customTags: ['CF-800'],
        language: 'Python',
        confusionNotes: `• What confused me: The special case w = 2!
• Why: 2 can only be divided into 1 + 1, both of which are odd, so 2 cannot be divided into two even parts!
• Condition: w > 2 and w % 2 == 0.`,
        firstSolvedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        lastRevisitedAt: now,
        revisitCount: 1,
        approaches: [
          {
            id: crypto.randomUUID(),
            name: 'Optimal',
            explanation: `Any even number greater than 2 can be divided into 2 and (w - 2), both of which are positive even integers. If w is odd or w == 2, it's impossible.`,
            code: `import sys

def solve():
    w = int(sys.stdin.read().strip())
    if w > 2 and w % 2 == 0:
        print("YES")
    else:
        print("NO")

if __name__ == '__main__':
    solve()`,
            language: 'Python',
            timeComplexity: 'O(1)',
            spaceComplexity: 'O(1)',
            notes: 'Check w > 2 and w % 2 == 0'
          }
        ],
        revisionHistory: [
          {
            id: crypto.randomUUID(),
            timestamp: now,
            notes: 'Quick check of CF 4A edge case w=2.',
            variantReviewed: 'Optimal'
          }
        ]
      }
    ];

    await Problem.insertMany(sampleProblems);
    console.log(`Successfully seeded ${sampleProblems.length} sample problems with multiple approaches, confusion notes, and revision history!`);
    process.exit(0);
  } catch (err) {
    console.error('Error during seeding:', err);
    process.exit(1);
  }
};

seedData();
