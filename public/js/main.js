$(document).ready(function () {
  // Add active class to clicked link and toggle submenu
  $(".sidebar-link").click(function () {
    var isActive = $(this).hasClass("active");

    // Remove active class from all links
    $(".sidebar-link").removeClass("active");
    // Add active class to the clicked link if it's not already active
    if (!isActive) {
      $(this).addClass("active");
    }

    // Toggle submenu
    var subMenu = $(this).next(".sub-menu");
    if (subMenu.length) {
      subMenu.toggleClass("show", !isActive); // Toggle the submenu only if link is not already active
    }
  });

  // Add active class to parent link if sub-menu is active
  $(".sub-menu").each(function () {
    if ($(this).hasClass("show")) {
      $(this).prev(".sidebar-link").addClass("active");
    }
  });
});
// file upload
$(document).ready(function () {
  // upload file
  var imgFile;
  $(document).on("click", ".uploadImg", function () {
    $(this).parent().find(".uploadFile").trigger("click");
  });

  $(document).on("change", ".uploadFile", function () {
    var file = this.files[0];
    if (file) {
      var reader = new FileReader();
      reader.onload = function (e) {
        if ($(this).hasClass("uploadVideo")) {
          // Update video source if file is a video
          $(this).closest(".in-upload").prev("video").find("source").attr("src", e.target.result);
          $(this).closest(".in-upload").prev("video")[0].load();  // Reload video to apply new source
        } else {
          // Update image source if file is an image
          $(this).closest(".card-body").find("img").attr("src", e.target.result);
        }
      }.bind(this);
      reader.readAsDataURL(file);
    }
  });
});

// rateyo

$(function () {
  $(".rateYo").rateYo({
    rating: 4.0,
    fullStar: true,
    readOnly: true,
    normalFill: "#ddd",
    ratedFill: "#ffc000",
    starWidth: "14px",
    spacing: "2px",
  });
});
// =======
$(document).ready(function () {
  // Show the sidebar when toggle-btn is clicked
  $("#toggle-btn").click(function () {
    $("#sidebar").show();
  });

  // Hide the sidebar when cross-btn is clicked
  $("#cross-btn").click(function () {
    $("#sidebar").hide();
  });
});

$(document).ready(function () {
  // Function to add a new row
  function addRow(tableId) {
    let $table = $(`#${tableId}`);
    let $lastRow = $table.find('tr:last').clone(); // Clone the last row

    $lastRow.find('input').val(''); // Clear the input values in the new row
    $table.append($lastRow); // Append the cloned row to the table
  }

  // Function to remove a row
  function removeRow() {
    let $row = $(this).closest('tr');
    if ($row.siblings('tr').length > 1) {
      $row.remove(); // Remove the row if more than one row exists
    } else {
      alert("Can't remove the last row");
    }
  }

  // Event listener for adding a new row to Section 2
  $('#addNewRowTbl').click(function () {
    addRow('newTable');
  });

  $('#addNewRowSection2').click(function () {
    addRow('newTableSection2');
  });

  // Event listener for adding a new row to Section 3
  $('#addNewRowSection3').click(function () {
    addRow('newTableSection3');
  });

  // Event listener for removing a row
  $(document).on('click', '.removeRow', removeRow);
});

