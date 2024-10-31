//contact form

$(document).on("submit", ".frmAjax", function (e) {
    e.preventDefault();
    var frm = this;
    var frmbtn = $(this).find("button[type='submit']");
    var frmIcon = $(this).find("button[type='submit'] i.spinner");
    frmbtn.attr("disabled", true);
    frmIcon.removeClass("hidden");
    $.ajax({
        url: $(this).attr('action'),
        data: new FormData(frm), // Serialize the form data
        dataType: 'JSON',
        method: 'POST',
        processData: false, // Prevent jQuery from processing the data
        contentType: false, // Prevent jQuery from overriding the content type
        error: function (rs) {
            frmbtn.attr("disabled", false);
            frmIcon.addClass("hidden");
            console.log(rs);
            // Display an error message using a toaster or alert
            showToast('Error submitting form. Please try again later.', 'error');
        },
        success: function (response) {
            frmbtn.attr("disabled", false);
            frmIcon.addClass("hidden");
            console.log("Response:", response);
            if (response.status == 1 || response.success == true) {
                // Display success message using Toastr.js
                showToast(response.message, 'success');
                if (response?.redirect_url) {
                    setTimeout(() => {
                        window.location.href = response?.redirect_url
                    }, 2000);
                }
            } else {
                // Display error message indicating the field that is empty
                showToast(response.message, 'error');
            }
        },
        complete: function () {
            frmbtn.attr("disabled", false);
            frmIcon.addClass("hidden");
            // Reset form if needed
            // frm[0].reset();
        },
    });
});

function showToast(message, type) {
    toastr.options = {
        "closeButton": true,
        "debug": false,
        "newestOnTop": false,
        "progressBar": true,
        "positionClass": "toast-top-right", // Top-right corner
        "preventDuplicates": false,
        "onclick": null,
        "showDuration": "300",
        "hideDuration": "1000",
        "timeOut": "5000",  // 5 seconds
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut"
    };
    // Use Toastr.js to display the message as a toaster notification
    if (type === 'success') {
        toastr.success(message);
    } else {
        toastr.error(message);
    }
}
$(document).ready(function () {
    console.log('Document is ready, script is running!');

    $("#frmSetting").validate({
        rules: {
            siteName: "required", // Field for site name
            siteEmail: {
                required: true,
                email: true // Validate as email
            },
            sitePhone: "required", // Field for site phone
            siteAddress: "required", // Field for site address
            siteDescription: "required" // Field for site description
        },
        messages: {
            siteName: "Please enter the site name", // Error message for site name
            siteEmail: {
                required: "Please enter your email address", // Error message for email if empty
                email: "Please enter a valid email address" // Error message for invalid email format
            },
            sitePhone: "Please enter your phone number", // Error message for phone number
            siteAddress: "Please enter your address", // Error message for address
            siteDescription: "Please enter a description" // Error message for description
        },

        errorPlacement: function (error, element) {
            error.appendTo(element.parent().find('.error'));
        }
    });
});

$(document).ready(function () {
    $("#changePasswordForm").validate({
        rules: {
            password: "required",
            npswd: {
                required: true,
                minlength: 6 // Assuming minimum length requirement for password
            },
            cpswd: {
                required: true,
                equalTo: "#npswd" // Ensure confirmPassword matches newPassword
            }
        },
        messages: {
            password: "Please enter your old password",
            npswd: {
                required: "Please enter a new password",
                minlength: "Password must be at least 6 characters long"
            },
            cpswd: {
                required: "Please confirm your new password",
                equalTo: "Passwords do not match"
            }
        },
        submitHandler: function (form) {
            $.ajax({
                url: "/admin/change-password",
                type: "POST",
                data: $(form).serialize(),
                dataType: "json",
                success: function (response) {
                    // Handle success response
                    if (response.status === 1) {
                        // Password successfully changed, show success message
                        alert("Password changed successfully!");
                        // Optionally, redirect the user to another page
                        window.location.href = "/admin/dashboard";
                    } else {
                        // Show error message
                        alert(response.message);
                    }
                },
                error: function (xhr, status, error) {
                    // console.log("XHR Response:", xhr.responseText);

                    // Handle error response
                    alert("Error: " + error);
                }
            });
        }
    });
});

$('#frmSetting').on('submit', function (e) {
    e.preventDefault(); // Prevent default form submission

    var formData = new FormData(this); // Get form data with files

    $.ajax({
        url: '/admin/update-settings', // Your server endpoint
        type: 'POST',
        data: formData, // Sending the form data, including files
        contentType: false, // Important for file upload
        processData: false, // Important for file upload
        success: function (response) {
            console.log('Settings updated successfully:', response);
        },
        error: function (xhr) {
            console.error('Error updating settings:', xhr.responseText);
        }
    });
});



$(document).ready(function () {
    $('.delete-item').on('click', function (e) {
        e.preventDefault();

        var deleteUrl = $(this).data('url'); // Get the URL from the data attribute
        var itemId = $(this).data('id'); // Get the ID from the data attribute
        var confirmation = confirm('Are you sure you want to delete this item?');

        if (confirmation) {
            $.ajax({
                url: deleteUrl, // Use the URL specified in the data attribute
                type: 'DELETE',
                success: function (response) {
                    if (response.status == 1) {
                        // Show the success toast
                        showToast(response.message, 'success');

                        // Remove the parent <tr> of the clicked delete link
                        $(e.target).closest('tr').remove(); // Remove the closest row

                    } else {
                        // Show error toast in case of failure
                        showToast(response.message, 'error');
                    }
                },
                error: function (xhr) {
                    showToast('An error occurred while trying to delete the item.', 'error');
                    console.error(xhr.responseText);
                }
            });
        }
    });
});












