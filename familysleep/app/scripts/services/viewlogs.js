'use strict';

/**
 * @ngdoc service
 * @name FamilySleep.viewLogs
 * @description
 * # viewLogs
 * Factory in the FamilySleep.
 This will keep track of logs across the app
 */

         /*
                logSession = {
                        'pages' : [
                                {'page' : '', id : '', date' : },
                                {},
                        ],
                        'sessionTimeStamps': [],
                        'users' : [],
                        'startTime': ,
                        'endTime':
                }
                logs = {
                        startTime : {
                                'users' : [],
                                'timeStamp': {
                                        'startTime': ,
                                        'endTime':
                                }
                                'pages' : [
                                        {'page' : '', id : '', 'date' : },
                                        {},
                                ]
                        },
                        ...
                }
                */

var module = angular.module(
        'FamilySleep'
)
        
module.factory(
    'viewLogs', 
    ['$timeout', '$uibModal', 'personaFactory', '$rootScope', 'recorderFactory', '$http', '$location', 'BASEURL_PYRAMID',
    function ($timeout, $uibModal, personaFactory, $rootScope, recorderFactory, $http, $location, BASEURL_PYRAMID) {
        var factory = {};

        factory.logs = {};
        factory.logSession = null;
        factory.doc_id = 'viewLogs';
        factory.doc_rev = null;
        factory.counter = 0;
        var waitTimeForLogging = 2 * 60000; //2 minutes wait to decide this is a new interaction session
        

        factory.logLastPage = function (currentTime) {
            if(factory.logSession.sessionTimeStamps[factory.logSession.pages.length-1] == currentTime) {
                  
                factory.logs[factory.logSession.startTime] = {
                        'users' : factory.logSession.users,
                        'cancel': factory.logSession.cancel,
                        'timeStamp': {
                                'startTime': moment(factory.logSession.startTime).format('YYYY/MM/DD_kk:mm'),
                                'currentTime': moment(currentTime).format('YYYY/MM/DD_kk:mm'), //this is the last time you interacted
                                'endTime': moment().format('YYYY/MM/DD_kk:mm')
                        },
                        'pages' : factory.logSession.pages
                }
                factory.putData();
                //sending audio data when user forget to stop recording.
                if($rootScope.recordRecording || $rootScope.recordPausing) {
                    //can add starttime to recorderFactory
                    //recorderFactory.startTime = moment(factory.logSession.startTime).format('YYYY/MM/DD_kk:mm');
                    //recorderFactory.startTime = new Date();
                    // if(factory.logSession.startTime){
                    //     recorderFactory.startTime = factory.logSession.startTime;    
                    // }
                    // else {
                    //     recorderFactory.startTime = new Date();
                    // }
                    
                    $rootScope.onStopRecord();
                } 

                factory.logSession = null;
            }
        }

        factory.putData = function(){
            var new_doc = {
                "_id" : "viewLogs" + factory.counter.toString(), //"promptId": recorderFactory.promptId, //"prompt": recorderFactory.prompt,
                "viewLogs": factory.logs
            };
            var date_format = moment(factory.logSession.startTime).format('YYYY_MM_DD_kk_mm_ss');
            
            // BASEURL_PYRAMID + '/document/viewLogs'
            $http(
                {
                    method: 'PUT',
                    url: BASEURL_PYRAMID + '/document/viewLogs' + date_format,
                    data: new_doc
                }
            ).then (function success (response){
                //factory.doc_id = "viewLogs" + factory.counter.toString();
                if(factory.counter >= 2){
                    factory.counter = 0;
                } else {
                    factory.counter++;    
                }
                
                //factory.doc_rev = response.data._rev;
            }).catch (function error (response){
                console.log("error in PUT");
                console.log(response.status);
                //if error schedule next put?
            });
        }

        /*
            if logSession is null: (start session)
                    initialize logSession = {};
                    logSession.startTime = date;
                    logSession.pages.add({page, date})
    
            else 

            start x min timer, once times up:
                    check with session to see if date == logSession.page.last.date
                    if different, means user clicked after this, we don't do anything
                    if same, means user haven't clicked for 2 mins. we treat it as the last click"  
                            save last click,
                            save the whole thing to logs.
        */

        // id=null

        factory.logPage = function (page, date, id) { 
            var doNotShowPop = $.inArray($location.path(),['/login', '/signup']);
            //var restrictedPage = $.inArray($location.path(), ['/login', '/register']) === -1;
            if (doNotShowPop == -1){
                if (typeof(id)==='undefined') id = null;
                var currentTime = new Date();

                if (factory.logSession == null) {
                    factory.logSession = {
                            'pages': [],
                            'sessionTimeStamps': [],
                            'users' : [],
                            'startTime': null,
                            'endTime': null,
                            'cancel': null
                    };
                    factory.logSession.startTime = currentTime;  
                    $timeout(factory.popup, 5 * 1000); 
                }
                factory.logSession.pages.push({'page': page, 'id' : id, 'date': date});
                factory.logSession.sessionTimeStamps.push(currentTime);
                $timeout(factory.logLastPage, waitTimeForLogging, true, currentTime); 
            }
            // if($location.path() === '/login' || $location.path() === '/signup'){
            //     //do not show up pop up
            // } else {
                
            // }
        }

        factory.popup = function() {
            factory.famMems = personaFactory.getAllNames();
            factory.famIDs = personaFactory.getAllIDs();

            var modalInstance = $uibModal.open({
                animation: true,
                ariaLabelledBy: 'modal-title',
                ariaDescribedBy: 'modal-body',
                templateUrl: 'app/views/templates/logmodalcontent.html',
                backdrop: 'static',
                keyboard: false,
                controller: 'LogModalInstanceCtrl',
                controllerAs: '$ctrl',
                windowClass:'app-modal-window',
                resolve: {
                    famMems: function() {
                        return factory.famMems;
                    },
                    promptCounter: function(){
                        return factory.counter;
                    }
                }
            });
            modalInstance.result.then(function (selectedItems) {
                /***** BUG///PROBLEM HERE factory.logSession in logLastPage
                gets set to null even if the popup have not been replied
                NEED TO FIGURE OUT WHAT HAPPENS HERE****/
                        /* peoblem about be fixed */
                if (factory.logSession == null) {
                    var currentTime = new Date();
                    factory.logSession = {
                            'pages': [],
                            'sessionTimeStamps': [],
                            'users' : [],
                            'startTime': null,
                            'endTime': null,
                            'cancel': null
                    };
                    factory.logSession.startTime = currentTime;  
                    factory.logSession.sessionTimeStamps.push(currentTime);
                    $timeout(factory.logLastPage, waitTimeForLogging, true, currentTime);
                }
                 //changed to 30 seconds wait before logging interaction
                factory.logSession.users = selectedItems.users;
                factory.logSession.cancel = selectedItems.cancel;
                recorderFactory.users = selectedItems.users;
                recorderFactory.prompt = selectedItems.prompt;
                recorderFactory.promptId = selectedItems.promptId;
                
            }, function (selectedItems) { //canceled popup but still logging interaction
                //$log.info('Modal dismissed at: ' + new Date());
                if (factory.logSession == null) {
                    var currentTime = new Date();
                    factory.logSession = {
                            'pages': [],
                            'sessionTimeStamps': [],
                            'users' : [],
                            'startTime': null,
                            'endTime': null,
                            'cancel': null
                    };
                    factory.logSession.startTime = currentTime;  
                    factory.logSession.sessionTimeStamps.push(currentTime);
                    $timeout(factory.logLastPage, 3 * 10000, true, currentTime);
                }
                factory.logSession.users = selectedItems.users;
                factory.logSession.cancel = selectedItems.cancel;
            });
        }

        return factory;
}]);


angular.module('FamilySleep').controller('LogModalInstanceCtrl', function ($uibModalInstance, $scope, famMems, promptCounter) {
    var $ctrl = this;
    $ctrl.famMems = famMems;
    $ctrl.buttonState = false;
    $ctrl.record = false;

    var promptCounter = promptCounter;

    var prompts = [
        "What are you learning abour your sleep habits?",
        "In what ways do you think you can improve your sleep?",
        "Look at another family member's <b>Weekly View</b>. Are they getting enough hours of sleep?",
        "Go to your <b>Weekly View</b> page. How is your mood with respect to your sleep?",
        "<i>Recommended to have at least two family members responding together.</i><hr>Go to the <b>Family Weekly View</b> page. Are there connections between each other's sleep and mood?",
        "Go to your <b>Individal Weekly View</b>. How is your mood with respect to your sleep?",
        "<i>Recommended to have at least two family members responding together.</i><hr> What are you learning about how your family sleeps?",
        "<i>Recommended for parents.</i><hr> Go to your child's <b>Individial Weekly View</b>. What information is surprising you? What is expected?",
        "<i>Recommended for parents.</i><hr> How are you using the information you see?",
        "What are your reactions to viewing every family member's sleep in one place?",
        "<i>Recommended to have at least one child and one parent.</i><hr> Go to <b>Family Weekly View</b>. Talk to each other about what is good about your sleep.",
        "<i>Recommended for parents.</i><hr> How are you using the information DreamCatcher is presenting?",
        "Go to your <b>Individual Weekly View</b>. Are you satisfied or dissastified with how you are sleeping?",
        "What has surprised you so far?",
        "<i>Recommended for parents.</i><hr> How are you using the information presented?",
        "Go to your <b>Individual Weekly View</b>. Looking at the sleep bars. Are you going to sleep at a consistent time? What can you change about your bed time routine?",
        "<i>Recommended to have at least two family members responding together.</i><hr> Go to <b>Family Weekly View</b>. Is there a day where the family slept poorly (e.g., where the circles are NOT full)? If so, what happened?",
        "<i>Recommended to have at least two family members responding together.</i><hr> Go to <b>Family Weekly View</b>. Is there a day where the family sleep well (e.g., where the circles ARE mostly full). If so, what worked?",
        "Go to <b>Family Daily View</b>. Pick a day where there is information. What are your thoughts on viewing the family in one place?",
        "<i>Recommended for children to participate.</i><hr> How many hours you are sleeping? What surprised you?",
        "<i>Recommended for children to participate.</i><hr> How many hours are your parents sleeping? What surprised you?",
        "What has been surprising about your sleep?",
        "What has been surprising about your children's sleep?",
        "<i>Recommended for one parent and one child.</i><hr> Are each of you going to sleep at a consistent time? If not, what can you do to improve your bedtime?",
        "<i>Recommended for one parent and one child.</i><hr> Are each of you waking up at a consistent time? If not, what can you do to improve your bedtime?",
        "<i>Recommended for parents.</i><hr>What is useful about viewing your children's and your sleep in one place?",
        "<i>Recommended for parents.</i><hr> How do you feel about viewing each other's sleep in one place?",
        "<i>Recommended for parents.</i><hr> What trends are you seeing about each other's sleep?",
        "<i>Recommended for parents.</i><hr> What are you learning about your children's sleep?",
        "<i>Recommended for parents.</i><hr> What are you learning about your spouse's sleep?",
        "<i>Recommended for parents.</i><hr> What conclusions are you making about your own sleep?",
        "<i>Recommended for parents.</i><hr> What conclusions are you making about your children's sleep?",
        "<i>Recommended for one parent and one child.</i><hr> Identify and share sleep improvements with your children",
        "<i>Recommended for children.</i><hr> How do you feel about sharing your sleep with your family?",
        "<i>Recommended for child or parent.</i><hr> Look at your sleep tell us what you see. Where do you need help?",
        "Is there a day where most of the family reached their sleep goal? If so, reflect on what led to a good night sleep for the family.",
        "Is there a day where most of the family did not reach their sleep goal? If so, reflect on what you would like to do different.",
        "<i>Recommended for at least two family members to answer together.</i><hr> What are you learning about each other's sleep?",
        "<i>Recommended for children.</i><hr>. What are days that you are proud about your sleep?",
    ];

    var getRandomInteger = function(){
        return Math.floor(Math.random() * prompts.length);
    };

    if(promptCounter == 0){
        $ctrl.promptId = getRandomInteger();
        $ctrl.prompt = prompts[$ctrl.promptId];
        $ctrl.record = true;

    } else {
        $ctrl.record = false;
    }
    
    // for checkbox buttons in logmodal instance
    $ctrl.checkFam = [];
    for (var i = 0; i < $ctrl.famMems.length; i++) {
        $ctrl.checkFam[i] = ({name: $ctrl.famMems[i], checked : false});
    }

    // checks that at least one button is clicked in logmodal to activate OK button
    $ctrl.isOK = function () {
        for (var i = 0; i < $ctrl.checkFam.length; i++) {
            if ($ctrl.checkFam[i].checked === true) {
                $ctrl.buttonState = true;
                break;
            } else {
                $ctrl.buttonState = false;
            }
        }
    };


    $ctrl.ok = function () {
        var selectedNames = [];
        for (var i = 0; i < $ctrl.checkFam.length; i++) {
            if ($ctrl.checkFam[i].checked === true) {
                selectedNames.push($ctrl.checkFam[i].name)
            }
        }
        $uibModalInstance.close({users: selectedNames, promptId: $ctrl.promptId, prompt: $ctrl.prompt, cancel: 'false'});
        if ($ctrl.record) {
            $scope.onRecord($ctrl.prompt);
            $scope.$parent.recordStoppedClear = false;
            $scope.$parent.recordRecording = true;
        }
    };

    $ctrl.cancel = function () {
        var selectedNames = [];
        for (var i = 0; i < $ctrl.checkFam.length; i++) {
            if ($ctrl.checkFam[i].checked === true) {
                selectedNames.push($ctrl.checkFam[i].name)
            }
        }
        $ctrl.record = false;
        $uibModalInstance.dismiss({users: selectedNames, promptId: $ctrl.promptId, prompt: $ctrl.prompt, cancel: 'true'});
    };

    $ctrl.askAnother = function(){
        $ctrl.promptId = getRandomInteger();
        $ctrl.prompt = prompts[$ctrl.promptId];
    };
});