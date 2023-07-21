/**
 * The `Calc` namespace provides mathematical calculation functions.
 * @namespace Calc
 */
namespace Calc {
    /**
     * Generates a random number using the cryptographic random value generator.
     * @returns {number} The random number between 0 and 1.
     */
    export function CryptoRandom(): number {
        const cr = window.crypto;
        const tab = new Uint32Array(1);
        cr.getRandomValues(tab);
        return tab[0] / 4294967295;
    }
}

export default Calc;
