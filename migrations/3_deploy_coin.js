var TTGCoin = artifacts.require("./TTGCoin.sol");

module.exports = function(deployer) {  
  deployer.deploy(TTGCoin, {overwrite: true, gas: 6721975});
};