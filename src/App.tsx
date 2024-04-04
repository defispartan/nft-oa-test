import { useEffect, useState } from "react";
import "./App.css";

import { NftOpenActionKit } from "nft-openaction-kit";
import { LensClient, production } from "@lens-protocol/client";

const lensClient = new LensClient({
  environment: production,
});

const nftOpenActionKit = new NftOpenActionKit({
  decentApiKey: import.meta.env.VITE_DECENT_API_KEY || "",
  raribleApiKey: import.meta.env.VITE_RARIBLE_API_KEY || "",
});

function App() {
  const [nftLink, setNftLink] = useState("");
  const [postLink, setPostLink] = useState("");
  const [actionData, setActionData] = useState("");
  const [postActionData, setPostActionData] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [publication, setPublication] = useState<any | null>(null);
  const [loadingInitialize, setLoadingInitialize] = useState<boolean>(false);
  const [loadingAct, setLoadingAct] = useState<boolean>(false);

  useEffect(() => {
    const fetchPublicationData = async () => {
      const parts = postLink.split("/");
      const postIdIndex = parts.indexOf("posts");
      let pubId = "";
      if (postIdIndex !== -1 && postIdIndex + 1 < parts.length) {
        pubId = parts[postIdIndex + 1];
      }
      if (pubId !== "") {
        const clientPublication = await lensClient.publication.fetch({
          forId: pubId,
        });
        setPublication(clientPublication);
      }
    };
    fetchPublicationData();
  }, [postLink]);

  const handleDetect = async () => {
    try {
      setLoadingInitialize(true);
      const result = await nftOpenActionKit.detectAndReturnCalldata(nftLink);
      setActionData(result || "No action data found");
    } catch (err) {
      setActionData("Error: " + err);
    }
    setLoadingInitialize(false);
  };

  const handlePostAction = async () => {
    try {
      if (publication) {
        const [profileHex, pubHex] = publication.id.split("-");
        setLoadingAct(true);
        const result = await nftOpenActionKit.actionDataFromPost(
          {
            profileId: parseInt(profileHex, 16).toString(),
            actionModules: [publication.openActionModules[0].contract.address],
            actionModulesInitDatas: [
              publication.openActionModules[0].initializeCalldata,
            ],
            pubId: parseInt(pubHex, 16).toString(),
          },
          "10859",
          "0x354cd122a1b3ebf102306f6bccccf8abebaff708",
          "0x354cd122a1b3ebf102306f6bccccf8abebaff708",
          "137",
          BigInt(1),
          "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270"
        );
        const resultStr = JSON.stringify(result, (_, value) =>
          typeof value === "bigint" ? value.toString() : value
        );
        setPostActionData(resultStr || "No action data found");
      }
    } catch (err) {
      setPostActionData("Error: " + err);
    }
    setLoadingAct(false);
  };

  return (
    <div className="App">
      <div className="section">
        <h2>Action Initialize Calldata</h2>
        <input
          type="text"
          value={nftLink}
          onChange={(e) => setNftLink(e.target.value)}
          placeholder="Enter NFT link"
        />
        <button className="query" onClick={handleDetect}>
          Detect
        </button>
        {loadingInitialize && <div className="loader" />}
        <div className="result">{actionData}</div>
      </div>
      <div className="section">
        <h2>Action Execute Calldata</h2>
        <input
          type="text"
          value={postLink}
          onChange={(e) => setPostLink(e.target.value)}
          placeholder="Enter hey.xyz post link"
        />
        <button className="query" onClick={handlePostAction}>
          Get Action Data
        </button>
        {loadingAct && <div className="loader" />}
        <div className="result">{postActionData}</div>
      </div>
    </div>
  );
}

export default App;
