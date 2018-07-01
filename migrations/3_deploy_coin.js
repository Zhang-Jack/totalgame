var TTGCoin = artifacts.require("./TTGCoin.sol");

module.exports = function(deployer) {  
  deployer.deploy(TTGCoin, {overwrite: false, gas: 6721975});
};