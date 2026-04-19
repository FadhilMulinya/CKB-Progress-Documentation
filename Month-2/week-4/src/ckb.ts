import * as cccModule from '@ckb-ccc/core';

// Handle both named and default exports
const ccc = (cccModule as any).default || cccModule;

/**
 * CKB blockchain operations
 */

const cccClient = new ccc.ClientPublicTestnet();

export function generatePrivateKey(): string {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return "0x" + [...bytes].map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function getAddress(privateKey: string): Promise<string> {
    try {
        const signer = new ccc.SignerCkbPrivateKey(cccClient, privateKey);
        return (await signer.getAddressObjSecp256k1()).toString();
    } catch (error) {
        console.error('Error getting address:', error);
        throw new Error('Failed to derive address from private key');
    }
}

export async function getBalance(address: string): Promise<string> {
    try {
        const { script: lock } = await ccc.Address.fromString(address, cccClient);
        let total = ccc.Zero;
        
        for await (const cell of cccClient.findCellsByLock(lock, null, true)) {
            total += cell.cellOutput.capacity;
        }
        
        return ccc.fixedPointToString(total);
    } catch (error) {
        console.error('Error getting balance:', error);
        throw new Error('Failed to fetch balance');
    }
}

export async function sendCKB(
    privateKey: string, 
    toAddress: string, 
    ckbAmount: number
): Promise<string> {
    try {
        const signer = new ccc.SignerCkbPrivateKey(cccClient, privateKey);
        const { script: toLock } = await ccc.Address.fromString(toAddress, cccClient);

        const tx = ccc.Transaction.from({
            outputs: [{ 
                lock: toLock, 
                capacity: ccc.fixedPointFrom(ckbAmount.toString()) 
            }],
            outputsData: [],
        });

        await tx.completeInputsByCapacity(signer);
        await tx.completeFeeBy(signer, 1000);
        
        return signer.sendTransaction(tx);
    } catch (error) {
        console.error('Error sending CKB:', error);
        throw new Error('Transaction failed: ' + (error as Error).message);
    }
}