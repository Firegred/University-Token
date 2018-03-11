form = document.getElementById("registration-info");
form.onsubmit = function () {
    var all_fields_completed = true;
    var all_letters_pattern = /^[A-Za-z]+$/;
    var all_digits_pattern = /^[0-9]+$/;

    var first_name = document.getElementById("first_name");
    if (first_name.value.length < 2 || first_name.value.length > 16 || !first_name.value.match(all_letters_pattern)) {
        first_name.classList.add("is-invalid");
        all_fields_completed = false;
    } else {
        first_name.classList.remove("is-invalid");
    }

    var last_name = document.getElementById("last_name");
    if (last_name.value.length < 2 || last_name.value.length > 16 || !last_name.value.match(all_letters_pattern)) {
        last_name.classList.add("is-invalid");
        all_fields_completed = false;
    } else {
        last_name.classList.remove("is-invalid");
    }

    var birthday = document.getElementById("birthday");
    if (!birthday.value.match(all_digits_pattern) || birthday.value < 1 || birthday.value > 31) {
        birthday.classList.add("is-invalid");
        all_fields_completed = false;
    } else {
        birthday.classList.remove("is-invalid");
    }

    var birthyear = document.getElementById("birthyear");
    if (!birthyear.value.match(all_digits_pattern) || birthyear.value < 1900 || birthyear.value > 2015) {
        birthyear.classList.add("is-invalid");
        all_fields_completed = false;
    } else {
        birthyear.classList.remove("is-invalid");
    }

    var zip = document.getElementById("zip");
    if (!zip.value.match(all_digits_pattern) || zip.value.length != 5) {
        zip.classList.add("is-invalid");
        all_fields_completed = false;
    } else {
        zip.classList.remove("is-invalid");
    }

    var password = document.getElementById("password");
    var repeat_password = document.getElementById("repeat_password");
    var fb1 = document.getElementById("password_feedback_1");
    var fb2 = document.getElementById("password_feedback_2");
    if (password.value != repeat_password.value) {
        password.classList.add("is-invalid");
        repeat_password.classList.add("is-invalid");
        fb1.innerHTML = "";
        fb2.innerHTML = "Passwords do not match";
        all_fields_completed = false;
    } else if (password.value.length < 6 || password.value.length > 12) {
        password.classList.add("is-invalid");
        repeat_password.classList.remove("is-invalid");
        fb1.innerHTML = "Password should be between 6 and 12 characters";
        all_fields_completed = false;
    } else if (repeat_password.value.length < 6 || repeat_password.value.length > 12) {
        password.classList.remove("is-invalid");
        repeat_password.classList.add("is-invalid");
        fb2.innerHTML = "Password should be between 6 and 12 characters";
        all_fields_completed = false;
    } else {
        password.classList.remove("is-invalid");
        repeat_password.classList.remove("is-invalid");
    }

    console.log(all_fields_completed);

    return all_fields_completed;
}