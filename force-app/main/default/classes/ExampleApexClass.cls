public with sharing class ExampleApexClass {

    public static List<Integer> sieve(Integer limit) {
        if (limit < 2) {
            return new List<Integer>();
        }

        Boolean[] isComposite = new Boolean[limit + 1];
        for (Integer i = 0; i <= limit; i++) {
            isComposite[i] = false;
        }

        Integer sqrtLimit = (Integer) Math.floor(Math.sqrt(limit));
        for (Integer i = 2; i <= sqrtLimit; i++) {
            if (!isComposite[i]) {
                for (Integer j = i * i; j <= limit; j += i) {
                    isComposite[j] = true;
                }
            }
        }

        List<Integer> primes = new List<Integer>();
        for (Integer i = 2; i <= limit; i++) {
            if (!isComposite[i]) {
                primes.add(i);
            }
        }
        return primes;
    }
}
