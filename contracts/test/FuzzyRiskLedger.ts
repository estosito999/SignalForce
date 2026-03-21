import { expect } from "chai";
import { ethers } from "hardhat";

describe("SignalForceLedger", function () {
  it("anchors posts and comments, tracks subscriptions and reputation", async function () {
    const [owner, author, subscriber] = await ethers.getSigners();

    const factory = await ethers.getContractFactory("SignalForceLedger");
    const ledger = await factory.deploy();
    await ledger.waitForDeployment();

    const postId = "post-001";
    const postHash = ethers.keccak256(ethers.toUtf8Bytes("signalforce-post"));
    const commentHash = ethers.keccak256(ethers.toUtf8Bytes("signalforce-comment"));

    await ledger.connect(author).recordPost(postId, postHash);
    await ledger.connect(author).recordComment("comment-001", postId, commentHash);

    const anchors = await ledger.totalAnchors();
    expect(anchors).to.equal(2n);

    const myAnchors = await ledger.connect(author).getMyAnchors();
    expect(myAnchors.length).to.equal(2);
    expect(myAnchors[0].author).to.equal(author.address);
    expect(myAnchors[0].actionType).to.equal(0);
    expect(myAnchors[1].actionType).to.equal(1);

    await ledger.connect(subscriber).recordSubscription(author.address, { value: 1000n });
    expect(await ledger.creatorBalances(author.address)).to.equal(1000n);

    await ledger.connect(author).withdrawCreatorEarnings();
    expect(await ledger.creatorBalances(author.address)).to.equal(0n);

    await ledger.connect(author).recordReputationCheckpoint(author.address, 7300, "Pro");
    expect(await ledger.totalReputationCheckpoints()).to.equal(1n);

    await ledger.connect(owner).pause();
    await expect(ledger.connect(author).recordPost("post-002", postHash)).to.be.revertedWithCustomError(
      ledger,
      "EnforcedPause"
    );
  });
});
