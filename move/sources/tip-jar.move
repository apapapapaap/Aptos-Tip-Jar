// File: move/sources/tip_jar.move
module my_addr::tip_jar {
    use std::signer;
    use aptos_framework::aptos_account;

    // An "entry" function is a function that can be called
    // as the starting point of a transaction.
    public entry fun send_tip(sender: &signer, recipient: address, amount: u64) {
        // Assert that the tip amount is greater than zero.
        // This prevents spamming with zero-value transactions.
        assert!(amount > 0, 0);

        // This is the core logic. It calls a trusted function from the
        // core Aptos Framework to securely transfer APT coins.
        aptos_account::transfer(sender, recipient, amount);
    }
}