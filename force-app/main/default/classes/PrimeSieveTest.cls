/**
 * Unit tests for PrimeSieve. Exercises the CI pipeline's RunLocalTests path.
 */
@isTest
private class PrimeSieveTest {
    @isTest
    static void primesUpTo_returnsKnownPrimes() {
        List<Integer> result = PrimeSieve.primesUpTo(30);
        List<Integer> expected = new List<Integer>{ 2, 3, 5, 7, 11, 13, 17, 19, 23, 29 };
        System.assertEquals(expected, result, 'Primes up to 30 did not match the expected sequence.');
    }

    @isTest
    static void primesUpTo_includesLimitWhenPrime() {
        // 13 is prime and is the inclusive upper bound.
        List<Integer> result = PrimeSieve.primesUpTo(13);
        System.assertEquals(13, result[result.size() - 1], 'Inclusive prime limit should be included.');
    }

    @isTest
    static void primesUpTo_handlesEdgeCases() {
        System.assertEquals(0, PrimeSieve.primesUpTo(1).size(), 'No primes exist <= 1.');
        System.assertEquals(0, PrimeSieve.primesUpTo(0).size(), 'No primes exist <= 0.');
        System.assertEquals(0, PrimeSieve.primesUpTo(-5).size(), 'Negative limit should yield no primes.');
        System.assertEquals(0, PrimeSieve.primesUpTo(null).size(), 'Null limit should yield no primes.');
        System.assertEquals(new List<Integer>{ 2 }, PrimeSieve.primesUpTo(2), 'Smallest prime case.');
    }

    @isTest
    static void primesUpTo_countMatchesForLargerRange() {
        // There are 25 primes below 100.
        System.assertEquals(25, PrimeSieve.primesUpTo(100).size(), 'Expected 25 primes <= 100.');
    }

    @isTest
    static void isPrime_classifiesValuesCorrectly() {
        for (Integer p : new List<Integer>{ 2, 3, 5, 7, 97 }) {
            System.assert(PrimeSieve.isPrime(p), p + ' should be prime.');
        }
        for (Integer c : new List<Integer>{ -1, 0, 1, 4, 9, 100 }) {
            System.assert(!PrimeSieve.isPrime(c), c + ' should not be prime.');
        }
        System.assert(!PrimeSieve.isPrime(null), 'null should not be prime.');
    }
}
