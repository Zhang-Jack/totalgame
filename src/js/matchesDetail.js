App = {
    web3Provider: null,
    contracts: {},
    sortMethod: 0,
    captainAddress: 0,
    vueContainer: new Vue(),
    account: 0,
    estimatedWin: 0,
    betsAllCount: 0,
    redeemTokenID: 0,
    isFirstLoad: 1,
    syncSucceed: false,
    
    



    init: function() {
        const Status = Object.freeze({
            NOTFOUND: 0,
            PLAYING: 1,
            PROCESSING: 2,
            PAYING: 3,
            CANCELING: 4
        });
        if(App.isFirstLoad){
            $.LoadingOverlay("show",{
                background  : "rgba(255, 255, 255, 0.0)",
                imageColor  : "#EFA330"               
                     
            });   
            setTimeout(function(){
                $.LoadingOverlay("hide");
                if(!App.syncSucceed){
                  alert("Syncing failed, please login metamask and reload this page later")
                }
              }, 30000); 
            App.isFirstLoad = 0;
        }
        App.captainAddress = $.cookie('captain');
        if(!App.captainAddress) App.captainAddress = 0; 
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
                     betDataList: [],
                     totalWon: 0,
                     moreGamesList: [],
                     isCheckWinner: 0,
                     ETHNumber: 0.01,
                     preEstimatedWin: 0.01,
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
                    },
                    contractValueResult: 0,
                    //isWinner: false, // 判断是否赢局投注中,动态显示按钮内容
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
                            let that = this
                             $.getJSON('../matches.json', matchIDQuery, function(data) {
                                // $("#matchesDetailContainer").find(".points_spread").text("Points Spread: " + data[matchIDQuery].PointSpread);
                                that.queryData.Points_Spread = data[matchIDQuery].PointSpread
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
                computed: {
                    betList: function() {
                        let list = []
                        this.betDataList.forEach(element => {
                            element.pickedPurchaseDateStr = new Date(element.pickedPurchaseDate * 1000).toISOString()
                            element.pickedPurchaseDateStr = element.pickedPurchaseDateStr.substring(0, 10) + ' ' + element.pickedPurchaseDateStr.substring(11, 19)
                            list.push(element)
                        })
                        return list;                        
                    },
                },
                 methods: {
                     checkWinner(winner) {
                         /*if (winner == 2) {
                             if (this.gameGroup.HaveDraw) {
                                 return
                             }
                         } else {*/
                            console.log('checkWinner ', winner);
                             this.isCheckWinner = winner;
                             App.vueContainer.isCheckWinner = winner;
                             console.log('App.vueContainer.isCheckWinner',App.vueContainer.isCheckWinner);
                    },
                    //pointsMouseover() {
                        //alert('Every match has an associated point spread. This is a positive or negative number that is added to the ﬁnal score of teamA (the home team) prior to evaluating the outcome of a match. This is done so that even teams with different skill levels can be traded at close to even odds, and also so that ties (“pushes”) cannot occur (because in most sports scores are integers but point spreads have fractional components). TotalGame chooses its point-spreads based of the initially posted vegas or off-shore lines.')
                    // },
                     checkETH(eth) {
                         this.isCheckETH = eth;
                         if(eth<3){
                         this.ETHNumber = eth * 0.01;
                         }else if (eth ==3){
                            this.ETHNumber = 0.05;
                         }else if (eth == 4){
                            this.ETHNumber = 0.1;
                         }else{
                            this.ETHNumber = 0.5;
                         } 

                         App.contracts.TTGOracle.deployed().then(function(instance) {
                            ttgInstance = instance; 
                            console.log('App.vueContainer.ischeckWinner', App.vueContainer.isCheckWinner);
                            ttgInstance['betsAll'](App.vueContainer.gameGroup.matchID, App.vueContainer.isCheckWinner).then(function(value){
                                //if(err) console.log(err);
                                if(value){
                                App.estimatedWin =  (App.vueContainer.gameGroup.Contract_Value+App.vueContainer.ETHNumber*0.95)/((Math.round(parseInt(value[0].toString())/100000000000000)/10000)+App.vueContainer.ETHNumber*0.95);
                                console.log(App.estimatedWin);
                                App.vueContainer.preEstimatedWin = (App.estimatedWin*App.vueContainer.ETHNumber*0.95).toFixed(4);
                                console.log('App.vueContainer.gameGroup.ETHNumber', App.vueContainer.ETHNumber);
                                console.log('App.vueContainer.preEstimatedWin', App.vueContainer.preEstimatedWin);
                                if(App.vueContainer.preEstimatedWin < App.vueContainer.ETHNumber){
                                    console.log('App.vueContainer.gameGroup.ETHNumber', App.vueContainer.ETHNumber);
                                    App.vueContainer.preEstimatedWin = App.vueContainer.ETHNumber;
                                    info.pickedFactor = 1.00;
                                }
                                }
                            });
                        });
                        
                     },
                     ETHNumberHandle() {
                         console.log('ETHNumberHandle entered');
                        if(this.ETHNumber < 0.005) {
                            this.ETHNumber = 0.005;                            
                        }                        
                        else if(this.ETHNumber > 100.0) {
                            this.ETHNumber = 100.0;
                            alert('The maximum value of a single bet is 100.0 ETH');
                        }                        
                        
                         if (this.ETHNumber == 0.01) {
                             this.isCheckETH = 1
                         } else if (this.ETHNumber == 0.02) {
                             this.isCheckETH = 2
                         } else if (this.ETHNumber == 0.05) {
                             this.isCheckETH = 3
                         } else if (this.ETHNumber == 0.1) {
                             this.isCheckETH = 4
                         } else if (this.ETHNumber == 0.5) {
                             this.isCheckETH = 5
                         } else {
                             this.isCheckETH = 0
                         }
                         App.contracts.TTGOracle.deployed().then(function(instance) {
                            ttgInstance = instance; 
                            console.log('App.vueContainer.ischeckWinner', App.vueContainer.isCheckWinner);
                            ttgInstance['betsAll'](App.vueContainer.gameGroup.matchID, App.vueContainer.isCheckWinner).then(function(value){
                                //if(err) console.log(err);
                                if(value){
                                App.estimatedWin =  (App.vueContainer.gameGroup.Contract_Value+App.vueContainer.ETHNumber*0.95)/((Math.round(parseInt(value[0].toString())/100000000000000)/10000)+App.vueContainer.ETHNumber*0.95);
                                console.log(App.estimatedWin);
                                App.vueContainer.preEstimatedWin = (App.estimatedWin*App.vueContainer.ETHNumber*0.95).toFixed(4);
                                console.log('App.vueContainer.gameGroup.ETHNumber', App.vueContainer.ETHNumber);
                                console.log('App.vueContainer.preEstimatedWin', App.vueContainer.preEstimatedWin);
                                if(App.vueContainer.preEstimatedWin < App.vueContainer.ETHNumber){
                                    console.log('App.vueContainer.gameGroup.ETHNumber', App.vueContainer.ETHNumber);
                                    App.vueContainer.preEstimatedWin = App.vueContainer.ETHNumber;
                                    info.pickedFactor = 1.00;
                                }
                                }
                            });
                        });                         
                     },
                     ETHUp() {
                        this.ETHNumber = (this.ETHNumber * 1000 + 0.005 * 1000) / 1000
                         this.ETHNumberHandle()
                     },
                     ETHDown() {
                         if (this.ETHNumber <= 0.005) {
                             return
                         }
                        this.ETHNumber = (this.ETHNumber * 1000 - 0.005 * 1000) / 1000
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
                         matchIDQuery = this.theRequest.matchID;
                         let that = this;
                         $.getJSON('../matches.json', matchIDQuery, function(data) {
                            $("#matchesDetailContainer").find(".points_spread").text("Points Spread: " + data[matchIDQuery].PointSpread);
                            //that.queryData.Points_Spread = data[matchIDQuery].PointSpread;
                         });
                     
                         if(this.isCheckWinner == 0){
                             alert('Please select your favourite team first!');
                             return App.markAdopted();
                         }
                         if(this.ETHNumber == 0){
                            alert('Please check the betting ETH amount!');
                            return App.markAdopted();
                        }                         

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
                            console.log('App.captainAddress', App.captainAddress);
                            if(App.captainAddress == App.account){
                                alert('No same captain address with yourself is allowed');
                                App.captainAddress = 0;
                            }
                            return ttgInstance.buyToken(matchIDOnBet, teamIDOnBet, checkWinner, App.captainAddress, {from: account, gas: 300000, gasPrice:10500000000, value: ethOnBet});
                            }).then(function(result) {
                                console.log('buyToken succeed');
                                alert("Congratulations! You have bought a ticket for your team now!");
                                return App.markAdopted(); 
                            }).catch(function(err) {
                                alert("Oops, we have an error here", error);
                                console.log(err.message);
                                return App.markAdopted(); 
                            });
                            
                        });
                    },
                    // 比赛取消时点击按钮事件
                    returnBet() {
                        // something
                     },
                    // 比赛已结束时投注中点击按钮事件
                    redeemETH(item) {
                        
                        App.redeemTokenID = item.tokenID;
                        
                        console.log('App.redeemTokenID', App.redeemTokenID);
                        
                        App.contracts.TTGOracle.deployed().then(function(instance) {
                            var ttgInstance = instance;
                            ttgInstance.redeemToken(App.redeemTokenID, App.vueContainer.gameGroup.teamWonID).then(function(result){                                
                                if(result){
                                    alert('Redeem ETH has been done, please check your wallet later!');
                                    item.pickedHasPayed = true;
                                } 

                            });
                        });
                    },
                    // 比赛已结束是未投注中点击事件
                    redeemNoETH() {
                        // something
                    },
                    // 已有投注列表,投注项目explore点击事件,item为列表项目数据
                    userExplore(item) {
                        console.log('item', item)
                        // something
                    }
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
        App.account = defaultAccount;
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
              var TTGbalance = $('#TTGbalance');
              if(result){
              tgc_balance = Math.round(result/10000000000000000)/100;
              }else{
                tgc_balance = 0;
              }       
              TTGbalance.append(tgc_balance);
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
                        if(winCombination){
                            App.vueContainer.gameGroup.teamWonID = winCombination == 1? App.vueContainer.gameGroup.TeamAID:App.vueContainer.gameGroup.TeamBID;
                        }
                        
                        display_contract_value = betsSumIn + ' ETH';
                        $("#matchesDetailContainer").find(".count_right").text(display_contract_value);
                        $("#matchesDetailContainer").find(".grand-prize").text(display_contract_value);
                    App.vueContainer.contractValueResult = betsSumIn;


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

    getMatchResult: function(){
        url = 'https://totalgame.io/api/v2/game/'+App.vueContainer.gameGroup.matchID+'/result.json';
        $.getJSON(url, function(data){
            App.vueContainer.gameGroup.ScoreA = data.ScoreA;
            App.vueContainer.gameGroup.ScoreB = data.ScoreB;
            console.log('ScoreA =', App.vueContainer.gameGroup.ScoreA);
            console.log('ScoreB =', App.vueContainer.gameGroup.ScoreB);
        });
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
                        var betsSumIn = Math.round(betsSumIn/100000000000000)/10000;             
                        // console.log('betsSumIn =', betsSumIn);  
                        feeValue =   parseInt(lottery[10].toString());
                        // console.log('feeValue =', feeValue);  
                        status =   lottery[11];
                        console.log('status =', status);  
                        isFreezing =  lottery[12];
                        // console.log('isFreezing =', isFreezing); 
                        
                        //$(".game-block__bottom[game-id=0]").find('.SmartContractValue').text(betsSumIn);
                        
                        App.vueContainer.gameGroup.Game_Status = status;
                        console.log('App.vueContainer.gameGroup.Game_Status =', App.vueContainer.gameGroup.Game_Status); 
                        if(status == 3) App.getMatchResult();
                        App.vueContainer.gameGroup.Contract_Value = betsSumIn;
                        App.betsAllCount = betsCount;
                        display_contract_value = betsSumIn + ' ETH';
                        $("#matchesDetailContainer").find(".count_right").text(display_contract_value);
                        $("#matchesDetailContainer").find(".grand-prize").text(display_contract_value); 
                        App.vueContainer.gameGroup.Game_Status = status;
                        App.vueContainer.gameGroup.Contract_Value = betsSumIn;
                        if(winCombination){
                            App.vueContainer.gameGroup.teamWonID = winCombination == 1? App.vueContainer.gameGroup.TeamAID:App.vueContainer.gameGroup.TeamBID;
                        }                              
                        App.syncSucceed = true;
                        $.LoadingOverlay("hide"); 

                    });
                    console.log('account =', App.account);
                    if(!App.account) return;
                ttgInstance.getUserTokensByMatch(App.account, App.vueContainer.queryData.matchID).then(function(result){                    
                    if(result){
                    //console.log(result);
                    var tickets = result.split(",");                    
                    tickets.forEach(ticket=>{
                        ttgInstance.getTokenByID(parseInt(ticket)).then(function(data){
                            info= {pickedTeam: "",
                            pickedTeamID: 0,
                            pickedTeamPicture: "",
                            pickedBetAmount: 0.005,
                            pickedFactor: 2.63,
                            pickedEstimatedWin: 0.013,
                            pickedPurchaseDate: 1527988400,
                            pickedOtherNum: 0,
                            pickedPayMent: 0,
                            pickedHasPayed: true,
                            tokenID: 0};
                            if(data[2] == 1){
                                info.pickedTeam = App.vueContainer.gameGroup.TeamA;
                                info.pickedTeamID = App.vueContainer.gameGroup.TeamAID;
                                info.pickedTeamPicture = App.vueContainer.gameGroup.TeamAPicture;                                
                                info.pickedBetAmount = Math.round(parseInt(data[0].toString())/100000000000000)/10000;
                                info.pickedPurchaseDate = parseInt(data[3].toString());                             

                            }else if(data[2] == 2){
                                info.pickedTeam = App.vueContainer.gameGroup.TeamB;
                                info.pickedTeamID = App.vueContainer.gameGroup.TeamBID;
                                info.pickedTeamPicture = App.vueContainer.gameGroup.TeamBPicture;
                                info.pickedBetAmount = Math.round(parseInt(data[0].toString())/100000000000000)/10000;
                                info.pickedPurchaseDate = parseInt(data[3].toString());                             
                                
                            }    
                            info.pickedOtherNum = App.betsAllCount > 0? (App.betsAllCount-1):0;
                            sameComboBetsAmount = Math.round(parseInt(data[7].toString())/100000000000000)/10000;
                            info.pickedFactor = (App.vueContainer.gameGroup.Contract_Value/sameComboBetsAmount).toFixed(3);
                            info.pickedEstimatedWin = (info.pickedBetAmount/sameComboBetsAmount*App.vueContainer.gameGroup.Contract_Value).toFixed(4);
                            info.pickedPayMent = Math.round(parseInt(data[1].toString())/100000000000000)/10000;
                            info.pickedHasPayed = data[6];
                            info.tokenID = parseInt(data[8].toString());
                            console.log('info.pickedHasPayed', info.pickedHasPayed);
                            App.vueContainer.betDataList.push(info);
                            /*
                            var EstimatedWin;
                            console.log('data[4]', parseInt(data[4].toString()));
                            console.log('data[2]', parseInt(data[2].toString()));
                            ttgInstance['betsAll'](parseInt(data[4].toString()), parseInt(data[2].toString())).then(function(value){
                                sameComboBetsAmount = Math.round(parseInt(value[0].toString())/100000000000000)/10000;
                                console.log('sameComboBetsAmount =', sameComboBetsAmount);
                                console.log('App.vueContainer.Contract_Value', App.vueContainer.gameGroup.Contract_Value);
                                App.info.pickedFactor = App.vueContainer.gameGroup.Contract_Value/sameComboBetsAmount;
                                App.info.pickedEstimatedWin = App.info.pickedBetAmount/sameComboBetsAmount*App.vueContainer.gameGroup.Contract_Value;
                                console.log('info.pickedFactor =', App.info.pickedFactor);
                                console.log('info.pickedEstimatedWin =', App.info.pickedEstimatedWin);                                
                                App.vueContainer.betDataList.push(App.info);
                            });*/
                            
                            // ttgInstance['betsAll'](3, 1, function (err, value){
                                // if(err) console.log(err);
                                // if(value) EstimatedWin = web3.fromWei(value[0].toString());
                            // });
                            
                            //App.vueContainer.betDataList.push(info);
                            
                        });
                        

                    })
                }

                });           
            


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