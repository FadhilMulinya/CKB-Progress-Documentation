import {fiberClient} from  "../../week-2/fiber/client.js";


function getArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1 || index + 1 >= process.argv.length) return undefined;
  return process.argv[index + 1];
}

interface ConnectPeerParams {
    multiAddress: string;
    save?: boolean;

}


export async function connectPeer(params:ConnectPeerParams) : Promise<unknown>{

    return fiberClient.call("connect_peer", [{
      multi_address: params.multiAddress,
      save: params.save ?? false
    }]);
}

async function main() {

    const multiAddress = getArg("--multiAddress");
    const save = getArg("--save") === "true";

    if(!multiAddress) throw new Error("Missing --multiAddress");
    if(!save) throw new Error("Missing --save");

    const result = await connectPeer({
        multiAddress,
        save
    })
    console.log(JSON.stringify(result, null, 2));

}

main().catch((error ) => {
    console.error("Failed to connect peer:", error);
    process.exit(1);
})