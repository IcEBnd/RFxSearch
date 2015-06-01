searchApp.controller('RFxlist', function ($scope, ejsResource) {
    var $btn;

    $(document).ready(function() {
      status('Loading..');
      updateList();

      $('#deleteForm').on('submit', function() {
        $btn = $(document.activeElement);

        if (
            /* there is an activeElement at all */
            $btn.length &&

            /* it's a child of the form */ 
            $('#deleteForm').has($btn) &&

            /* it's really a submit element */
            $btn.is('button[type="submit"], input[type="submit"], input[type="image"]') &&

            /* it has a "name" attribute */
            $btn.is('[name]')
        ) {
            //console.log("Seems, that this element was clicked:", $btn);
            /* access $btn.attr("name") and $btn.val() for data */
            console.log($btn.val());
        }

        var r = confirm("Delete " + $btn.val() + "?");
        console.log(r);

        if(r) {
          $('#deleteRFx').val($btn.val());
          status("Deleting..");
          $(this).ajaxSubmit({
            error: function(xhr) {
              status('Error: ' + xhr.statusText);
            },
            success: function(response) {
              console.log("deleted", response);

              if (response['status'] == "error") {
                status('Failed to delete "' + $('#deleteRFx').val() + '", ' + response.error);
              } else {
                status('Successfully deleted ' +  response.response.rfx);
              }

              updateList();
            }
          });
        }

        return false;
      });

      function drawRow(rowIdx, rowData) {
        var row = $('<tr />')
        $('#importTable').append(row);

        var l = rowData.length;
        //row.append($('<td>' + (rowIdx+1) + '</td>'));
        for (var i = 0; i < l; i++) {
          row.append($('<td>' + rowData[i] + '</td>'));
        }

        row.append('<input type="submit" value="' + rowData[0] + '" name="delete' + rowIdx + '">')
      }

      function status(text) {
        $("#deleteStatus").text(text);
        console.log('Status: ' + text);
      }

      function updateList() {
        $('#importTableBody').empty();
        $.getJSON( "api/list", function( response ) {
          if (response.status === 'error') {
            status('Failed, ' + response.error.message);
          }
          else {
            var data = JSON.parse(response.response);

            for (var i = 0; i < data.length; i++) {
              drawRow(i, data[i]);
            }
            status('');
          }
        });
      }
    });

});

