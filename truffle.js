const HDWalletProvider = require("truffle-hdwallet-provider");

const fs = require('fs');

let secrets;
let mnemonic = '';

if (fs.existsSync('pwd.json')) {
  secrets = fs.readFileSync('pwd.json', 'utf8').toString();
  if(secrets != undefined){
    //console.log(secrets);
    mnemonic = secrets;
    //console.log(mnemonic);
  }else{
    console.log("err occured");
  }
}

module.exports = {
  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  },
  networks: {
    ropsten: {
      provider: function() {       
        return new HDWalletProvider(mnemonic, "https://ropsten.infura.io/k3cLgOP73ndjAuEiirf1");
      },
      gas: 3971238,
	    gasPrice: 6500000000,
      network_id: 3
    },
        development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*" // Match any network id
    }
  }
};
