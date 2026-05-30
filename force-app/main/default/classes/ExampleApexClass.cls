public with sharing class ExampleApexClass {

    public static List<Integer> sieve(Integer n) {
        if (n < 2) {
            return new List<Integer>();
        }

        List<Boolean> isComposite = new List<Boolean>();
        for (Integer i = 0; i <= n; i++) {
            isComposite.add(false);
        }

        Integer sqrtN = (Integer) Math.floor(Math.sqrt((Double) n));
        for (Integer i = 2; i <= sqrtN; i++) {
            if (!isComposite[i]) {
                for (Integer j = i * i; j <= n; j += i) {
                    isComposite[j] = true;
                }
            }
        }

        List<Integer> primes = new List<Integer>();
        for (Integer i = 2; i <= n; i++) {
            if (!isComposite[i]) {
                primes.add(i);
            }
        }
        return primes;
    }
}
