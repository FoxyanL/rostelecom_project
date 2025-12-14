import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployVoting: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("Voting", {
    from: deployer,
    args: [["Option A", "Option B", "Option C"]],
    log: true,
  });
};

export default deployVoting;
deployVoting.tags = ["Voting"];
