App = {
    web3Provider: null,
    contracts: {},
    sortMethod: 0,
    captainAddress: 0,
    vueContainer: new Vue(),


    init: function() {
        const Status = Object.freeze({
            NOTFOUND: 0,
            PLAYING: 1,
            PROCESSING: 2,
            PAYING: 3,
            CANCELING: 4
        });

        $.getJSON('../TTGOracle.json', function(data) {
            // Get the necessary contract artifact file and instantiate it with truffle-contract
            var AdoptionArtifact = data;
            App.contracts.TTGOracle = TruffleContract(AdoptionArtifact);

            // Set the provider for our contract
            App.contracts.TTGOracle.setProvider(App.web3Provider);
        });

        // Load matches.
        
         $.getJSON('../matches.json', function(data) {
             App.vueContainer = new Vue({
                 el: '#matchesDetailContainer',
                 data: {
                     theRequest: new Object(),
                     gameGroup: null,
                     total: 0,
                     gamesList: [],
                     gamesDoneList: [],
                     totalWon: 0,
                     moreGamesList: [],
                     isCheckWinner: 0,
                     ETHNumber: 0.005,
                     isCheckETH: 0,
                     queryData: {
                         matchID: 0,                         
                         TeamA: '',
                         TeamAID: 0,
                         TeamB: '',
                         TeamBID: 0,
                         Group: '',
                         Points_Spread: 0,
                         eth: 0
                     }
                 },
                 mounted: function() {
                     let gamesList = JSON.parse(localStorage.getItem('gamesList'));
                     var url = location.search;
                     if (url.indexOf("?") != -1) {
                         var str = url.substr(1);
                         strs = str.split("&");
                         for (var i = 0; i < strs.length; i++) {
                             this.theRequest[strs[i].split("=")[0]] = unescape(strs[i].split("=")[1]);
                         }
                     }
                     data.forEach(element => {
                         if (element.Group == this.theRequest.Group && element.TeamA == this.theRequest.TeamA && element.TeamB == this.theRequest.TeamB) {
                             this.gameGroup = element;
                             this.queryData.matchID = this.theRequest.matchID;
                             var matchIDQuery = this.theRequest.matchID;
                             console.log('matchIDQuery = ', matchIDQuery);
                             this.queryData.TeamAID = this.theRequest.TeamAID;
                             this.queryData.TeamBID = this.theRequest.TeamBID;
                             this.queryData.TeamA = this.theRequest.TeamA;
                             this.queryData.TeamB = this.theRequest.TeamB;
                             $.getJSON('../matches.json', matchIDQuery, function(data) {
                                //this.queryData.Points_Spread = data[matchIDQuery].PointSpread;                                
                                $("#matchesDetailContainer").find(".points_spread").text("Points Spread: "+data[matchIDQuery].PointSpread);
                             });

                         }
                         element.DeadlineTimeStr = new Date(element.DeadlineTime * 1000).toISOString()
                         element.DeadlineTimeStr = element.DeadlineTimeStr.substring(0, 10) + ' ' + element.DeadlineTimeStr.substring(11, 19)
                     });

                     for (var i = 0; i < data.length; i++) {
                         if (this.gamesDoneList.length <= 5) {
                             if (data[i].Game_Status == 3) {
                                 this.totalWon += data[i].Contract_Value
                                 this.gamesDoneList.push(data[i])
                             }
                         }
                         if (data[i].Game_Status == 1) {
                             this.moreGamesList.push(data[i])
                         }
                     }
                 },
                 methods: {
                     checkWinner(winner) {
                         /*if (winner == 2) {
                             if (this.gameGroup.HaveDraw) {
                                 return
                             }
                         } else {*/
                             this.isCheckWinner = winner
                         //}
                     },
                     checkETH(eth) {
                         this.isCheckETH = eth
                         this.ETHNumber = eth * 0.005
                     },
                     ETHNumberHandle() {
                         if (this.ETHNumber == 0.005) {
                             this.isCheckETH = 1
                         } else if (this.ETHNumber == 0.01) {
                             this.isCheckETH = 2
                         } else if (this.ETHNumber == 0.015) {
                             this.isCheckETH = 3
                         } else if (this.ETHNumber == 0.02) {
                             this.isCheckETH = 4
                         } else if (this.ETHNumber == 0.025) {
                             this.isCheckETH = 5
                         } else {
                             this.isCheckETH = 0
                         }
                     },
                     ETHUp() {
                         this.ETHNumber += 0.005
                         this.ETHNumberHandle()
                     },
                     ETHDown() {
                         if (this.ETHNumber <= 0.005) {
                             return
                         }
                         this.ETHNumber -= 0.005
                         this.ETHNumberHandle()
                     },
                     goToDetail(item) {
                         let url = "matchesDetail.html?TeamA=" + item.TeamA + "&TeamB=" + item.TeamB + "&Group=" + item.Group
                         window.location.href = url;
                     },
                     makeBET() {
                         this.queryData = {
                             matchID: this.theRequest.matchID,
                             TeamA: this.theRequest.TeamA,
                             TeamAID: this.theRequest.TeamAID,
                             TeamB: this.theRequest.TeamB,
                             TeamBID: this.theRequest.TeamBID,
                             Group: this.theRequest.Group,
                             eth: this.ETHNumber
                         };

                         var ethOnBet = web3.toWei(this.queryData.eth, 'ether');
                         var teamIDOnBet = parseInt(this.queryData.TeamAID);
                         var matchIDOnBet = parseInt(this.queryData.matchID);
                         var checkWinner = this.isCheckWinner;
                         if(this.checkWinner == 2){
                            teamIDOnBet = parseInt(this.queryData.TeamBID);
                         }                         
                        //  console.log('this.queryData', this.queryData);
                         web3.eth.getAccounts(function(error, accounts) {
                            if (error) {
                              console.log(error);
                            }
                          
                            var account = accounts[0];
                         App.contracts.TTGOracle.deployed().then(function(instance) {
                            ttgInstance = instance;                                                                                                               
                            return ttgInstance.buyToken(matchIDOnBet, teamIDOnBet, checkWinner, 0, {from: account, gas: 200000, value: ethOnBet});
                            }).then(function(result) {
                                console.log('buyToken succeed');
                                alert("Congratulations! You have bought a ticket for your team now!");
                                return App.markAdopted(); 
                            }).catch(function(err) {
                                alert("Oops, we have an error here", error);
                                console.log(err.message);
                            });
                            
                        });
                         //let url = "install_tutorial.html?"
                         //window.location.href = url;
                     },
                 },
             })
         });
        return App.initWeb3();
    },

    initWeb3: function() {
        // Is there an injected web3 instance?
        App.handleAdopt
        if (typeof web3 !== 'undefined') {
            App.web3Provider = web3.currentProvider;
        } else {
            // If no injected web3 instance is detected, fall back to Ganache
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
        }
        web3 = new Web3(App.web3Provider);
        var defaultAccount = web3.eth.defaultAccount;
        console.log('defaultAccount =', defaultAccount);
        var account = $('#account');
        var display_owner = defaultAccount.toString().substring(2, 42);
        display_owner = display_owner.toUpperCase(display_owner);
        display_owner = "0x" + display_owner;
        account.append(display_owner);
        var balance = $('#balance');
        var real_balance = 0.0;
        if (!defaultAccount || defaultAccount == null) {
            window.location.replace("../dapp/install_tutorial.html");
        }
        if (defaultAccount) real_balance = web3.eth.getBalance(defaultAccount, function(error, result) {
            if (!error) {
                real_balance = Math.round(result/100000000000000)/10000;

                console.log(JSON.stringify(result));
                balance.append(real_balance);
            } else
                console.error(error);
        });

        $.getJSON('../TTGCoin.json', function(data){
            var TTGCoinArtifact = data;
            App.contracts.TTGCoin = TruffleContract(TTGCoinArtifact);
            App.contracts.TTGCoin.setProvider(App.web3Provider);
            App.contracts.TTGCoin.deployed().then(function(instance){
              var ttgCoinInstance = instance;
              return ttgCoinInstance.balanceOf(defaultAccount);
            }).then(function(result){
              var TGCbalance = $('#TGCbalance');
              if(result){
              tgc_balance = Math.round(result/10000000000000000)/100;
              }else{
                tgc_balance = 0;
              }       
              TGCbalance.append(tgc_balance);
            });        
        });

        web3.eth.filter('latest', function(error, result) {
            if (!error)
                console.log(result);
            else
                console.log(error);
        });

        return App.initContract();
    },

    initContract: function() {

        $.getJSON('../ItemToken.json', function(data) {
            // Get the necessary contract artifact file and instantiate it with truffle-contract
            var AdoptionArtifact = data;
            App.contracts.ItemToken = TruffleContract(AdoptionArtifact);

            // Set the provider for our contract
            App.contracts.ItemToken.setProvider(App.web3Provider);

            // Use our contract to retrieve and mark the adopted pets
            App.markAdopted();
        });

        $.getJSON('../TTGOracle.json', function(data) {
            // Get the necessary contract artifact file and instantiate it with truffle-contract
            var AdoptionArtifact = data;
            App.contracts.TTGOracle = TruffleContract(AdoptionArtifact);

            // Set the provider for our contract
            App.contracts.TTGOracle.setProvider(App.web3Provider);

            App.contracts.TTGOracle.deployed().then(function(instance) {
                ttgInstance = instance;                
                ttgInstance.getLotteryByID(App.vueContainer.queryData.matchID).then(function(lottery) {
                        gameIDCallBack = parseInt(lottery[3].toString());
                        // console.log('gameID =', gameIDCallBack);
                        gameName = lottery[0].toString();
                        // console.log('gameName =', gameName);
                        gameCountCombinations =   parseInt(lottery[1].toString());
                        // console.log('gameCountCombinations =', gameCountCombinations);
                        dateStopBuy = new Date(parseInt(lottery[2].toString())*1000).toISOString();
                        dateStopBuyDay = dateStopBuy.substring(0, 10);
                        dateStopBuyTime = dateStopBuy.substring(11, 19);
                        // console.log('dateStopBuy =', dateStopBuy);           
                        // console.log('dateStopBuyDay =', dateStopBuyDay);
                        // console.log('dateStopBuyTime =', dateStopBuyTime);
                        minStake =   parseInt(lottery[6].toString());
                        // console.log('minStake =', minStake);  
                        winCombination =   parseInt(lottery[7].toString());
                        // console.log('winCombination =', winCombination);                                 
                        betsCount =   parseInt(lottery[8].toString());
                        // console.log('betsCount =', betsCount);  
                        betsSumIn =   parseInt(lottery[9].toString());
                        betsSumIn = Math.round(betsSumIn/100000000000000)/10000;             
                        // console.log('betsSumIn =', betsSumIn);  
                        feeValue =   parseInt(lottery[10].toString());
                        // console.log('feeValue =', feeValue);  
                        status =   lottery[11];
                        // console.log('status =', status);  
                        isFreezing =  lottery[12];
                        // console.log('isFreezing =', isFreezing); 
                        //TODO: need to add gameID to blockchain
                        //$(".game-block__bottom[game-id=0]").find('.SmartContractValue').text(betsSumIn);
                        
                        App.vueContainer.gameGroup.Game_Status = status;
                        App.vueContainer.gameGroup.Contract_Value = betsSumIn;
                        display_contract_value = betsSumIn + ' ETH';
                        $("#matchesDetailContainer").find(".count_right").text(display_contract_value);
                        $("#matchesDetailContainer").find(".grand-prize").text(display_contract_value);
                        


                    })
                


            });
            // Use our contract to retrieve and mark the adopted pets
            //App.markAdopted();
        });


        return App.bindEvents();
    },

    bindEvents: function() {
        // $(document).on('click', '.btn-bet', App.handleBet);
        $(document).on('click', '.button_redeem', App.redeem);
        $(document).on('click', '.PriceDescending', App.PriceDescending);
    },

    redeem:function(){

            console.log('redeem called!');
            App.contracts.TTGOracle.deployed().then(function(instance) {
                ttgInstance = instance;
                ttgInstance.getTokenByID(5).then(function (tokenData){
                    payment = parseInt(tokenData[1].toString());
                    if(payment > 0) console.log("payment =", payment);
                    combination = tokenData[2];
                    console.log("combination", combination);
                    teamID = App.vueContainer.theRequest.TeamAID;
                    if(combination == 2){
                        teamID = App.vueContainer.theRequest.TeamBID;                    
                    }
                    console.log("teamID won =", teamID);

                    return ttgInstance.redeemToken(7, teamID);
                });
                      
              });

    },

    PriceAscending: function() {
        var ascending = false;
        var convertToNumber = function(value) {
            return parseFloat(value);
        };
        //App.markAdopted();
        App.sortMethod = 1;
        console.log('PriceAscending button onclick ');
        var items = $('#petsRow').find('.col-lg-3');
        var sorted = items.sort(function(a, b) {
            return (ascending ==
                (convertToNumber($(a).find('#pricespan').html()) <
                    convertToNumber($(b).find('#pricespan').html()))) ? 1 : -1;
        });
        //ascending = ascending ? false : true;

        $('#petsRow').append(sorted);

    },

    PriceDescending: function() {
        var ascending = true;
        var convertToNumber = function(value) {
            return parseFloat(value);
        };
        App.sortMethod = 2;
        console.log('PriceDescending button onclick ');
        var items = $('#petsRow').find('.col-lg-3');
        var sorted = items.sort(function(a, b) {
            return (ascending ==
                (convertToNumber($(a).find('#pricespan').html()) <
                    convertToNumber($(b).find('#pricespan').html()))) ? 1 : -1;
        });
        //ascending = ascending ? false : true;

        $('#petsRow').append(sorted);

    },



    markAdopted: function(adopters, account) {
        console.log('markAdopted entered!');
        $.getJSON('../TTGOracle.json', function(data) {
            // Get the necessary contract artifact file and instantiate it with truffle-contract
            var AdoptionArtifact = data;
            App.contracts.TTGOracle = TruffleContract(AdoptionArtifact);

            // Set the provider for our contract
            App.contracts.TTGOracle.setProvider(App.web3Provider);

            App.contracts.TTGOracle.deployed().then(function(instance) {
                ttgInstance = instance;                
                ttgInstance.getLotteryByID(App.vueContainer.queryData.matchID).then(function(lottery) {
                        gameIDCallBack = parseInt(lottery[3].toString());
                        // console.log('gameID =', gameIDCallBack);
                        gameName = lottery[0].toString();
                        // console.log('gameName =', gameName);
                        gameCountCombinations =   parseInt(lottery[1].toString());
                        // console.log('gameCountCombinations =', gameCountCombinations);
                        dateStopBuy = new Date(parseInt(lottery[2].toString())*1000).toISOString();
                        dateStopBuyDay = dateStopBuy.substring(0, 10);
                        dateStopBuyTime = dateStopBuy.substring(11, 19);
                        // console.log('dateStopBuy =', dateStopBuy);           
                        // console.log('dateStopBuyDay =', dateStopBuyDay);
                        // console.log('dateStopBuyTime =', dateStopBuyTime);
                        minStake =   parseInt(lottery[6].toString());
                        // console.log('minStake =', minStake);  
                        winCombination =   parseInt(lottery[7].toString());
                        // console.log('winCombination =', winCombination);                                 
                        betsCount =   parseInt(lottery[8].toString());
                        // console.log('betsCount =', betsCount);  
                        betsSumIn =   parseInt(lottery[9].toString());
                        betsSumIn = Math.round(betsSumIn/100000000000000)/10000;             
                        // console.log('betsSumIn =', betsSumIn);  
                        feeValue =   parseInt(lottery[10].toString());
                        // console.log('feeValue =', feeValue);  
                        status =   lottery[11];
                        // console.log('status =', status);  
                        isFreezing =  lottery[12];
                        // console.log('isFreezing =', isFreezing); 
                        
                        //$(".game-block__bottom[game-id=0]").find('.SmartContractValue').text(betsSumIn);
                        
                        App.vueContainer.gameGroup.Game_Status = status;
                        App.vueContainer.gameGroup.Contract_Value = betsSumIn;
                        display_contract_value = betsSumIn + ' ETH';
                        $("#matchesDetailContainer").find(".count_right").text(display_contract_value);
                        $("#matchesDetailContainer").find(".grand-prize").text(display_contract_value);       


                    })       


            });

        });
    },

  

};

$(function() {
    $(window).load(function() {
        //var sortMethod = 0;
        App.init();
    });
});