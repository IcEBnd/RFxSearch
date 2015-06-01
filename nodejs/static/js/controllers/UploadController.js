searchApp.controller('Upload', function($scope, ejsResource) {
    function status(text) {
      $('#importStatus').text('Status: ' + text);
    }

    $(document).ready(function() {
      $('#importForm').submit(function() {
        status('Importing..');
        $(this).ajaxSubmit({
          error: function(xhr) {
            status('Error: ' + xhr.statusText);
          },
          success: function(response) {
            console.log('imported', response);
            response = JSON.parse(response);

            if (response['status'] == 'error') {
              status('Failed to import, ' + response['error']['message']);
            } else {
              status('Successfully imported ' + response['response']['items'].length +
                     ' items in ' + response['response']['took'] + ' ms.');
            }
          }
        });

        return false;
      });

      $('#uploadForm').submit(function() {
        $(this).ajaxSubmit({
          error: function(xhr) {
            status('Error: ' + xhr);
          },
          success: function(response) {

            // Reset potential previous upload
            $('#importTable').html('<thead id="importTableHeader"></thead><tbody></tbody>');
            status('');

            drawTable(response);
            $('#import').show();
            $('#importTable').show();

            function drawTable(data) {
              for (var i = 0; i < data.length; i++) {
                drawRow(i, data[i]);
              }

              $('#importTableHeader').append('<tr>');

              $('#importTableHeader').append('<th></th>');
              for (var i = 0; i < data[0].length; i++) {
                $('#importTableHeader').append('<th>' +
                                               '  <select name="col' + i + '">' +
                                               '    <option value=""></option>' +
                                               '    <option value="key">Key</option>' +
                                               '    <option value="question">Question</option>' +
                                               '    <option value="importance">Importance</option>' +
                                               '    <option value="response">Response</option>' +
                                               '    <option value="comment">Comment</option>' +
                                               '  </select>' +
                                               '</th>');
              }

              $('#importTableHeader').append('</tr>');
              $('#importTableJSON').val(JSON.stringify(data));
            }

            function drawRow(rowIdx, rowData) {
              var row = $('<tr />');
              $('#importTable').append(row);

              var l = rowData.length;
              row.append($('<td>' + (rowIdx + 1) + '</td>'));
              for (var i = 0; i < l; i++) {
                row.append($('<td>' + rowData[i] + '</td>'));
              }
            }
          }
        });

        return false;
      });
    });
});
