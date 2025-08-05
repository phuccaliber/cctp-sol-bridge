import { minimist } from "zx";
import { depositForBurnEvm, depositForBurnEvmWithHook } from "./evm";
import { receiveMessageSol } from "./solana";

enum CommandName {
    Sol2Evm = "sol2evm",
    Evm2Sol = "evm2sol",
    ReclaimEventAccount = "reclaim",
}

const IRIS_API_URL = "https://iris-api-sandbox.circle.com";

interface ParsedArgs {
    amount: number;
    maxFee: number;
    minFinalityThreshold: number;
    hookData: string;
    attestation: string;
    destinationMessage: string;
    messageSentEventAccount: string;
}

const main = async () => {
    const commandName: CommandName = process.argv.slice(2)[0] as CommandName;
    console.log("CommandName", commandName);
    const rawArgs = minimist(process.argv.slice(3), {
        string: ["amount", "maxFee", "minFinalityThreshold", "hookData", "attestation", "destinationMessage", "messageSentEventAccount"],
    });

    const args: ParsedArgs = {
        amount: Number(rawArgs.amount),
        maxFee: Number(rawArgs.maxFee),
        minFinalityThreshold: Number(rawArgs.minFinalityThreshold),
        hookData: rawArgs.hookData,
        attestation: rawArgs.attestation,
        destinationMessage: rawArgs.destinationMessage,
        messageSentEventAccount: rawArgs.messageSentEventAccount,
    };

    if (commandName === CommandName.Evm2Sol) {
        const depositTxHash = args.hookData ?
            await depositForBurnEvmWithHook(args.amount, args.maxFee, args.minFinalityThreshold, args.hookData) :
            await depositForBurnEvm(args.amount, args.maxFee, args.minFinalityThreshold);

        console.log("Deposit txHash:", depositTxHash);

        // /// 0 for EVM_DOMAIN
        const attestationResponse = await fetchAttestation(
            depositTxHash,
            Number(process.env.EVM_DOMAIN)
          );


        const receiveTxHash = await receiveMessageSol(
            attestationResponse.message,
            attestationResponse.attestation
          );
        console.log("ReceiveMessage txHash:", receiveTxHash);

    } else if (commandName === CommandName.Sol2Evm) {
        console.log("Sol2Evm");
    } else if (commandName === CommandName.ReclaimEventAccount) {
        console.log("ReclaimEventAccount");
    } else {
        console.log("Invalid command");
    }
}

const fetchAttestation = async (txHash: string, domainId: number) => {
    console.log("Fetching attestation...");
    let attestationResponse: any = {};
    while (true) {
        const response = await fetch(
            `${IRIS_API_URL}/v2/messages/${domainId}?transactionHash=${txHash}`
        );
        attestationResponse = await response.json();
        // Wait 2 seconds to avoid getting rate limited
        if (
            attestationResponse.error ||
            !attestationResponse.messages ||
            attestationResponse.messages?.[0]?.attestation === "PENDING"
        ) {
            await new Promise((r) => setTimeout(r, 2000));
        } else {
            break;
        }
    }
    console.log("Attestation response:", attestationResponse);
    return attestationResponse.messages[0];
};

main().catch((error) => {
    console.error(error);
});