@isTest
private class ExampleApexClassTest {

    @isTest
    static void testSmallLimit() {
        List<Integer> primes = ExampleApexClass.sieve(10);
        System.assertEquals(4, primes.size());
        System.assertEquals(2, primes[0]);
        System.assertEquals(3, primes[1]);
        System.assertEquals(5, primes[2]);
        System.assertEquals(7, primes[3]);
    }

    @isTest
    static void testPrimesUpTo50() {
        List<Integer> primes = ExampleApexClass.sieve(50);
        // Known primes up to 50
        List<Integer> expected = new List<Integer>{2,3,5,7,11,13,17,19,23,29,31,37,41,43,47};
        System.assertEquals(expected.size(), primes.size());
        for (Integer i = 0; i < expected.size(); i++) {
            System.assertEquals(expected[i], primes[i]);
        }
    }

    @isTest
    static void testBelowTwo() {
        System.assertEquals(0, ExampleApexClass.sieve(1).size());
        System.assertEquals(0, ExampleApexClass.sieve(0).size());
    }

    @isTest
    static void testExactPrimeBoundary() {
        List<Integer> primes = ExampleApexClass.sieve(2);
        System.assertEquals(1, primes.size());
        System.assertEquals(2, primes[0]);
    }
}
