/**
 * PrimeSieve - computes prime numbers using the Sieve of Eratosthenes.
 *
 * A small, dependency-free Apex class used to exercise the CI pipeline's
 * Apex deploy + test execution path (RunLocalTests).
 */
public with sharing class PrimeSieve {
    /**
     * Returns all prime numbers up to and including `upperBound` using the
     * Sieve of Eratosthenes.
     *
     * @param upperBound upper bound (inclusive). Values < 2 yield an empty list.
     * @return ordered list of primes in [2, upperBound].
     */
    public static List<Integer> primesUpTo(Integer upperBound) {
        List<Integer> primes = new List<Integer>();
        if (upperBound == null || upperBound < 2) {
            return primes;
        }

        // isComposite[n] == true once we've marked n as a multiple of a prime.
        Boolean[] isComposite = new Boolean[upperBound + 1];

        for (Integer n = 2; n <= upperBound; n++) {
            if (isComposite[n] == true) {
                continue;
            }
            primes.add(n);
            // Start marking at n*n; smaller multiples already marked by smaller primes.
            for (Long multiple = (Long) n * n; multiple <= upperBound; multiple += n) {
                isComposite[multiple.intValue()] = true;
            }
        }
        return primes;
    }

    /**
     * Tests whether a single value is prime.
     *
     * @param value the number to test.
     * @return true when `value` is a prime number.
     */
    public static Boolean isPrime(Integer value) {
        if (value == null || value < 2) {
            return false;
        }
        for (Integer divisor = 2; (Long) divisor * divisor <= value; divisor++) {
            if (Math.mod(value, divisor) == 0) {
                return false;
            }
        }
        return true;
    }
}
