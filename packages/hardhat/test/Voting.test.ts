import { expect } from "chai";
import { ethers } from "hardhat";
import { Voting } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("Voting", function () {
  let voting: Voting;
  let owner: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const Voting = await ethers.getContractFactory("Voting");
    voting = await Voting.deploy(["Вариант А", "Вариант Б", "Вариант В"]);
    await voting.waitForDeployment();
  });

  describe("Развёртывание", function () {
    it("должно правильно инициализировать варианты голосования", async function () {
      const count = await voting.getOptionsCount();
      expect(count).to.equal(3);

      const [option0Name, option0Votes] = await voting.getOption(0);
      expect(option0Name).to.equal("Вариант А");
      expect(option0Votes).to.equal(0);
    });

    it("должно эмитировать событие VotingCreated", async function () {
      const Voting = await ethers.getContractFactory("Voting");
      await expect(Voting.deploy(["A", "B"]))
        .to.emit(Voting, "VotingCreated")
        .withArgs(2);
    });

    it("должно отклонять создание без вариантов", async function () {
      const Voting = await ethers.getContractFactory("Voting");
      await expect(Voting.deploy([])).to.be.revertedWith("At least one option required");
    });

    it("должно отклонять пустые названия вариантов", async function () {
      const Voting = await ethers.getContractFactory("Voting");
      await expect(Voting.deploy(["A", "", "C"])).to.be.revertedWith("Option name cannot be empty");
    });
  });

  describe("Голосование", function () {
    it("должно позволить пользователю проголосовать", async function () {
      await expect(voting.connect(user1).vote(0)).to.emit(voting, "Voted").withArgs(user1.address, 0, "Вариант А");

      const [, votes] = await voting.getOption(0);
      expect(votes).to.equal(1);
    });

    it("должно запретить повторное голосование", async function () {
      await voting.connect(user1).vote(0);

      await expect(voting.connect(user1).vote(1)).to.be.revertedWith("You already voted");
    });

    it("должно отклонить голосование за несуществующий вариант", async function () {
      await expect(voting.connect(user1).vote(99)).to.be.revertedWith("Invalid option");
    });

    it("должно корректно учитывать голоса нескольких пользователей", async function () {
      await voting.connect(user1).vote(0);
      await voting.connect(user2).vote(0);
      await voting.connect(owner).vote(1);

      const [, votes0] = await voting.getOption(0);
      const [, votes1] = await voting.getOption(1);

      expect(votes0).to.equal(2);
      expect(votes1).to.equal(1);
    });

    it("должно правильно отслеживать статус голосования", async function () {
      const statusBefore = await voting.checkIfVoted(user1.address);
      void expect(statusBefore).to.be.false;

      await voting.connect(user1).vote(0);

      const statusAfter = await voting.checkIfVoted(user1.address);
      void expect(statusAfter).to.be.true;
    });
  });

  describe("Получение результатов", function () {
    it("должно возвращать все варианты с голосами", async function () {
      await voting.connect(user1).vote(0);
      await voting.connect(user2).vote(2);

      const [names, votes] = await voting.getAllOptions();

      expect(names).to.deep.equal(["Вариант А", "Вариант Б", "Вариант В"]);
      expect(votes[0]).to.equal(1);
      expect(votes[1]).to.equal(0);
      expect(votes[2]).to.equal(1);
    });

    it("должно корректно возвращать информацию о варианте", async function () {
      await voting.connect(user1).vote(1);

      const [name, votes] = await voting.getOption(1);
      expect(name).to.equal("Вариант Б");
      expect(votes).to.equal(1);
    });

    it("должно отклонять запрос несуществующего варианта", async function () {
      await expect(voting.getOption(999)).to.be.revertedWith("Invalid option index");
    });
  });

  describe("Безопасность", function () {
    it("должно хранить hasVoted в mapping", async function () {
      const hasVotedBefore = await voting.hasVoted(user1.address);
      void expect(hasVotedBefore).to.be.false;

      await voting.connect(user1).vote(0);

      const hasVotedAfter = await voting.hasVoted(user1.address);
      void expect(hasVotedAfter).to.be.true;
    });

    it("не должно позволять изменить результаты после голосования", async function () {
      await voting.connect(user1).vote(0);
      const [, votesBefore] = await voting.getOption(0);

      // Попытка повторного голосования должна быть отклонена
      await expect(voting.connect(user1).vote(1)).to.be.revertedWith("You already voted");

      const [, votesAfter] = await voting.getOption(0);
      expect(votesAfter).to.equal(votesBefore);
    });
  });
});
