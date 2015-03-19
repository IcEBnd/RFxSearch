searchApp.controller('RFxsearch', function ($scope, ejsResource) {
    var ejs = ejsResource('http://192.168.59.103:9200');
    var index = 'rfxsearch_v1';

/*
    var highlightPost = ejs.Highlight(["Question"])
        .fragmentSize(150, "Question")
        .numberOfFragments(1, "Question")
        .preTags("<b>", "Question")
        .postTags("</b>", "Question");

    var hashtagFacet = ejs.TermsFacet('Question')
        .field('Question.text')
        .size(10);
*/
    var statusRequest = ejs.Request()
        .indices(index)
//        .types('sometype')
//        .highlight(highlightPost)
//        .facet(hashtagFacet);

    var activeFilters = {};

    $scope.resultsArr = [];

    $scope.search = function() {

        ga('send', 'event', 'rfxsearch', 'typed', $scope.queryTerm);

        activeFilters = {};
        $scope.resultsArr = [];
        if (!$scope.queryTerm == '') {
            results = statusRequest
//                .query(applyFilters(ejs.MatchQuery('_all', $scope.queryTerm)))
                .size(20)
                .query(ejs.QueryStringQuery($scope.queryTerm + "*"))  
                .fields(['Question', 'Response', 'Comment', 'Key'])
                .doSearch();

            //console.log(results);

            $scope.resultsArr.push(results);
        } else {
            results = {};
            $scope.resultsArr = [];
            activeFilters = {};
        }
    };

    $scope.getCount = function(){
        try {
            return String($scope.resultsArr[0].$$v.hits.total) + 
                    " results (" + String($scope.resultsArr[0].$$v.took/1000) + " s)";
        }
        catch (err) {
            return "";
        }
    }

    $scope.renderResult = function(result, field){
        //console.log(result);
        var resultText = "";

        if (field == 'key')

            if (result.fields.Key)
                resultText = result._type + " #" + result.fields.Key[0];
            else
                resultText = result._type + " #" + result._id

        else if (field == 'question')
            resultText = result.fields.Question[0];
        else if (field == 'response')
            resultText = result.fields.Response[0];
        else if (field == 'comment')
            resultText = result.fields.Comment[0];

        /*
        if (result.highlight)
            resultText = result.highlight.text[0];
        else if (result.fields.text)
            resultText = result.fields.text;
        else if (result.fields.Question[0])
            resultText = result.fields.Question[0] + field;
        else
            resultText = result._id;
        */

        //console.log(resultText)
        return resultText;
    };

/*    
    $scope.renderResultMetadata = function (result) {
        var metadata = "Twetted by <a href=\"https://twitter.com/" + result.fields.user.screen_name + "\">" + result.fields.user.name + "</a>, on " + result.fields.created_at.split("T")[0];
        return metadata;
    };
*/
    /*
     * facets
     */

/*
    $scope.isActive = function (field, term) {
        return activeFilters.hasOwnProperty(field + term);
    };

    searchFacet = function() {
        $scope.resultsArr = [];
        results = statusRequest
            .query(applyFilters(ejs.MatchQuery('_all', $scope.queryTerm)))
            .fields(['Question', 'Compliance', 'Comment'])
            .doSearch();

        $scope.resultsArr.push(results);
    };

    $scope.filter = function (field, term) {
        if ($scope.isActive(field, term)) {
            delete activeFilters[field + term];
        } else {
            activeFilters[field + term] = ejs.TermFilter(field, term);
        }
        searchFacet();
    };
*/
    var applyFilters = function(query) {

        var filter = null;
        var filters = Object.keys(activeFilters).map(function(k) { return activeFilters[k]; });
        // console.log(activeFilters)
        // if more than one filter, use AND operator
        if (filters.length > 1) {
            filter = ejs.AndFilter(filters);
        } else if (filters.length === 1) {
            filter = filters[0];
        }

        return filter ? ejs.FilteredQuery(query, filter) : query;
    };

    $scope.isFiltered = function () {
      if (!jQuery.isEmptyObject(activeFilters))
        return "<b>Reset search</b>";
    };

    $scope.resetFilter = function() {
        activeFilters = {};
        $scope.search();
    };
/*
    $scope.renderFacetItem = function(term, count){
        // if the filter is activated, add [x] sign
        if ($scope.isActive('hashtag.text', term)) {
            return "<b> [x] " + term + "</b> " + count;
        }
        else
            return "<b>" + term + "</b> " + count;
    };
*/

    /*
     * simple way for handling pagination
     * $per_page: number of returned results per page
     * $page: page counter
     */
    $scope.per_page = 10;
    $scope.page = 0;

    $scope.show_more = function () {
        $scope.page += 1;
        $scope.searchMore($scope.page*$scope.per_page);
    };

    $scope.searchMore = function(offset) {
        if (!$scope.queryTerm == '') {
            $scope.results = statusRequest
                .query(applyFilters(ejs.MatchQuery('_all', $scope.queryTerm)))
                .from(offset)
                .fields(['Question', 'Response', 'Comment', 'Key'])
                .doSearch();

            $scope.resultsArr.push($scope.results);
        }
    };
});
