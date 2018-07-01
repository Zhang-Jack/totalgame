var TTGLottery = artifacts.require("./TTGLottery.sol");

module.exports = function(deployer) {  
  deployer.deploy(TTGLottery, {overwrite: true, gas: 6721975});
};