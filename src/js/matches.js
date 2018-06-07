App = {
    web3Provider: null,
    contracts: {},
    sortMethod: 0,
    vueContainer: new Vue(),
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
                  alert("Syncing failed, please reload this page later")
                }
              }, 30000);             
            App.isFirstLoad = 0;
        }      
        var url = location.search;
        if (url.indexOf("?") != -1) {
            var str = url.substr(1);
            strs = str.split("=");
            console.log('strs[0] = ', strs[0]);
            if(strs[0]=="captain"){
                console.log('setting cookie');
                $.cookie(strs[0], strs[1], {path : '/', secure: false}); 
            }
            var captain = $.cookie('captain');
            console.log('captain = ', captain);
        }
        // Load matches.        
         $.getJSON('../matches.json', function(data) {
            App.vueContainer = new Vue({
                 el: '#container',
                 data: {
                     isAllGames: true,
                     sortType: 2,
                     tournamentType: 'all',
                     search: false,
                     isButton: false,
                     gamesStatus: 0,
                     gamesStatusStr: '',
                     searchStr: '',
                     gamesList: [],
                     gamesAllList: [],
                     TournamentList: [],
                    TournamentGameList: [],
                    page: 0,
                 },
                 mounted: function() {
                     let TournamentList = []
                     let TournamentGameList = []
                     let gamesListRusult = []
                     let matchId = 0
                     data.forEach(function(element, index) {
                         if (TournamentList.indexOf(element.Group) == -1) {
                             let groupItem = {
                                 groupName: '',
                                 groupList: []
                             }
                             groupItem.groupName = element.Group
                             groupItem.groupList[0] = element
                             TournamentList.push(element.Group)
                             TournamentGameList.push(groupItem)
                         }
                         TournamentGameList.forEach(function(TournamentItem, TournamentIndex) {
                             if (TournamentItem.groupName == element.Group) {
                                 TournamentItem.groupList.push(element)
                             }
                         });
                     });
                     data.sort(this.earlySort('DeadlineTime'))
                     data.forEach(element => {
                         // 比赛状态为未取消的相关设置,若为取消状态最初获取时就应该设置好 1 可下赌注  2 正在进行(今天正在进行的赌注)  3 已完成 4 已取消
                         if (element.Game_Status != 4) {
                             if (element.DeadlineTime <= new Date(new Date().toLocaleDateString()).getTime() / 1000) {
                                 element.Game_Status = 2
                             }
                             if (element.DeadlineTime <= new Date().getTime() / 1000) {
                                 element.Game_Status = 3
                             }
                         }
                         //element.matchId = matchId += 1
                         element.DeadlineTimeStr = new Date(element.DeadlineTime * 1000).toISOString()
                         element.DeadlineTimeStr = element.DeadlineTimeStr.substring(0, 10) + ' ' + element.DeadlineTimeStr.substring(11, 19)
                     });
                     this.TournamentGameList = TournamentGameList
                     this.gamesAllList = data
                     this.gamesList = this.gamesAllList
                 },
                 computed: {
                     total: function() {
                         return this.gamesList.length
                    },
                    dataList: function() {
                        let list = this.gamesList.slice(this.page * 10, (this.page * 10) + 10)
                        return list
                    },
                    numList: function() {
                        let num = Math.ceil(this.gamesList.length / 10)
                        let list = new Array(num)
                        return list
                     },
                 },
                 methods: {
                     earlySort(property) {
                         return function(a, b) {
                             var value1 = a[property];
                             var value2 = b[property];
                             return value2 - value1;
                         }
                     },
                     lateSort(property) {
                         return function(a, b) {
                             var value1 = a[property];
                             var value2 = b[property];
                             return value1 - value2;
                         }
                     },
                     gamesListHandle() {
                         this.gamesList = []
                         if (this.gamesStatus) {
                             if (this.searchStr) {
                                 if (this.isAllGames) {
                                     if (this.tournamentType == "all") {
                                         this.gamesAllList.forEach(item => {
                                             let flag = (eval("/" + this.searchStr + "/ig").test(item.Group) || eval("/" + this.searchStr + "/ig").test(item.TeamA) || eval("/" + this.searchStr + "/ig").test(item.TeamB)) && (item.Game_Status == this.gamesStatus)
                                             if (flag) {
                                                 this.gamesList.push(item)
                                             }
                                         })
                                     } else {
                                         this.gamesAllList.forEach(item => {
                                             let flag = (eval("/" + this.searchStr + "/ig").test(item.Group) || eval("/" + this.searchStr + "/ig").test(item.TeamA) || eval("/" + this.searchStr + "/ig").test(item.TeamB)) && (item.Group == this.tournamentType) && (item.Game_Status == this.gamesStatus)
                                             if (flag) {
                                                 this.gamesList.push(item)
                                             }
                                         })
                                     }
                                 } else {
                                     if (this.tournamentType == "all") {
                                         this.gamesAllList.forEach(item => {
                                             let flag = (eval("/" + this.searchStr + "/ig").test(item.Group) || eval("/" + this.searchStr + "/ig").test(item.TeamA) || eval("/" + this.searchStr + "/ig").test(item.TeamB)) && (item.DeadlineTime >= new Date().getTime() / 1000) && (item.Game_Status == this.gamesStatus)
                                             if (flag) {
                                                 this.gamesList.push(item)
                                             }
                                         })
                                     } else {
                                         this.gamesAllList.forEach(item => {
                                             let flag = (eval("/" + this.searchStr + "/ig").test(item.Group) || eval("/" + this.searchStr + "/ig").test(item.TeamA) || eval("/" + this.searchStr + "/ig").test(item.TeamB)) && (item.Group == this.tournamentType) && (item.DeadlineTime >= new Date().getTime() / 1000) && (item.Game_Status == this.gamesStatus)
                                             if (flag) {
                                                 this.gamesList.push(item)
                                             }
                                         })
                                     }
                                 }
                             } else {
                                 if (this.isAllGames) {
                                     this.gamesList = []
                                     if (this.tournamentType == "all") {
                                         this.gamesAllList.forEach(item => {
                                             if (item.Game_Status == this.gamesStatus) {
                                                 this.gamesList.push(item)
                                             }
                                         })
                                     } else {
                                         this.gamesAllList.forEach(item => {
                                             if (item.Group == this.tournamentType && item.Game_Status == this.gamesStatus) {
                                                 this.gamesList.push(item)
                                             }
                                         })
                                     }
                                 } else {
                                     this.gamesList = []
                                     if (this.tournamentType == "all") {
                                         this.gamesAllList.forEach(item => {
                                             let flag = (item.DeadlineTime >= new Date().getTime() / 1000) && (item.Game_Status == this.gamesStatus)
                                             if (flag) {
                                                 this.gamesList.push(item)
                                             }
                                         })
                                     } else {
                                         this.gamesAllList.forEach(item => {
                                             let flag = (item.Group == this.tournamentType) && (item.DeadlineTime >= new Date().getTime() / 1000) && (item.Game_Status == this.gamesStatus)
                                             if (flag) {
                                                 this.gamesList.push(item)
                                             }
                                         })
                                     }
                                 }
                             }
                         } else {
                             if (this.searchStr) {
                                 if (this.isAllGames) {
                                     if (this.tournamentType == "all") {
                                         this.gamesAllList.forEach(item => {
                                             let flag = eval("/" + this.searchStr + "/ig").test(item.Group) || eval("/" + this.searchStr + "/ig").test(item.TeamA) || eval("/" + this.searchStr + "/ig").test(item.TeamB)
                                             if (flag) {
                                                 this.gamesList.push(item)
                                             }
                                         })
                                     } else {
                                         this.gamesAllList.forEach(item => {
                                             let flag = (eval("/" + this.searchStr + "/ig").test(item.Group) || eval("/" + this.searchStr + "/ig").test(item.TeamA) || eval("/" + this.searchStr + "/ig").test(item.TeamB)) && (item.Group == this.tournamentType)
                                             if (flag) {
                                                 this.gamesList.push(item)
                                             }
                                         })
                                     }
                                 } else {
                                     if (this.tournamentType == "all") {
                                         this.gamesAllList.forEach(item => {
                                             let flag = (eval("/" + this.searchStr + "/ig").test(item.Group) || eval("/" + this.searchStr + "/ig").test(item.TeamA) || eval("/" + this.searchStr + "/ig").test(item.TeamB)) && (item.DeadlineTime >= new Date().getTime() / 1000)
                                             if (flag) {
                                                 this.gamesList.push(item)
                                             }
                                         })
                                     } else {
                                         this.gamesAllList.forEach(item => {
                                             let flag = (eval("/" + this.searchStr + "/ig").test(item.Group) || eval("/" + this.searchStr + "/ig").test(item.TeamA) || eval("/" + this.searchStr + "/ig").test(item.TeamB)) && (item.Group == this.tournamentType) && (item.DeadlineTime >= new Date().getTime() / 1000)
                                             if (flag) {
                                                 this.gamesList.push(item)
                                             }
                                         })
                                     }
                                 }
                             } else {
                                 if (this.isAllGames) {
                                     this.gamesList = []
                                     if (this.tournamentType == "all") {
                                         this.gamesList = this.gamesAllList
                                     } else {

                                         this.gamesAllList.forEach(item => {
                                             if (item.Group == this.tournamentType) {
                                                 this.gamesList.push(item)
                                             }
                                         })
                                     }
                                 } else {
                                     this.gamesList = []
                                     if (this.tournamentType == "all") {
                                         this.gamesAllList.forEach(item => {
                                             if (item.DeadlineTime >= new Date().getTime() / 1000) {
                                                 this.gamesList.push(item)
                                             }
                                         })
                                     } else {
                                         this.gamesAllList.forEach(item => {
                                             if (item.Group == this.tournamentType && item.DeadlineTime >= new Date().getTime() / 1000) {
                                                 this.gamesList.push(item)
                                             }
                                         })
                                     }
                                 }
                             }
                         }
                        this.page = 0
                     },
                     allGames() {
                         this.isAllGames = !this.isAllGames
                         this.gamesListHandle()
                     },
                     pickWinner() {
                         this.isAllGames = !this.isAllGames
                         this.gamesListHandle()
                     },
                     sortVal() {
                         if (this.sortType == 2) {
                             this.gamesList.sort(this.earlySort('DeadlineTime'))
                         } else {
                             this.gamesList.sort(this.lateSort('DeadlineTime'))
                         }
                     },
                     checkStatus(gamesStatus, status) {
                         if (gamesStatus != status) {
                             this.gamesStatus = status
                         } else {
                             this.gamesStatus = 0
                         }
                         this.gamesListHandle()
                     },
                     showSearch() {
                         this.search = !this.search
                     },
                    goTo(index) {
                        this.page = index
                    },
                     goToDetail(item) {
                         localStorage.setItem('gamesList', JSON.stringify(this.gamesList));
                         let url = "matchesDetail.html?TeamA=" + item.TeamA + "&TeamB=" + item.TeamB + "&Group=" + item.Group +"&matchID="+ item.matchID +"&TeamAID=" +item.TeamAID+"&TeamBID=" +item.TeamBID
                         window.location.href = url;
                     }
                 },
             })
         });
        

        return App.initWeb3();
    },

    initWeb3: function() {
        // Is there an injected web3 instance?
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
                return ttgInstance.getStatLotteries();
            }).then(function(items) {

                gameCount = parseInt(items[0].toString());
                // console.log('gameCount =', gameCount);
                playingCount = parseInt(items[1].toString());
                // console.log('playingCount =', playingCount);
                processingCount = parseInt(items[2].toString());
                // console.log('processingCount =', processingCount);
                playinglist = items[3].toString();
                // console.log('playinglist =', playinglist);
                processinglist = parseInt(items[4].toString());
                // console.log('processinglist =', processinglist);

                for (gameID = 0; gameID < gameCount; gameID++) {
                    ttgInstance.getLotteryByID(gameID).then(function(lottery) {
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
                        console.log('isFreezing =', isFreezing);         
                        //TODO: need to add gameID to blockchain
                        //$(".game-block__bottom[game-id='"+gameIDCallBack+"']").find('.SmartContractValue').text(betsSumIn);
                        for (var i = 0; i <= App.vueContainer.gamesAllList.length; i++) {
                            if (App.vueContainer.gamesAllList[i].matchID == gameIDCallBack) {
                                App.vueContainer.gamesAllList[i].Contract_Value = betsSumIn;
                                App.vueContainer.gamesAllList[i].Game_Status = status;
                            }
                        }

                        
                        // gamesVue.gamesAllList[gameIDCallBack].Contract_Value = 10;
                    })
                    // console.log('gameCount===>',gamesVue)
                };
                App.syncSucceed = true;
                $.LoadingOverlay("hide");


            });
            // Use our contract to retrieve and mark the adopted pets
            //App.markAdopted();
        });


        return App.bindEvents();
    },

    bindEvents: function() {
        $(document).on('click', '.btn-bet', App.handleBet);
        $(document).on('click', '.PriceAscending', App.PriceAscending);
        $(document).on('click', '.PriceDescending', App.PriceDescending);
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

    },



};

$(function() {
    $(window).load(function() {
        //var sortMethod = 0;
        App.init();
    });
});