// Đối tượng `Validator`
function Validator(options){    // đang được truyền vào 1 object
    function getParent(element, selector){      // selector: form-group
        while(element.parentElement){
            // matches: kiểm tra element có matches với css selector hay không?
            if (element.parentElement.matches(selector)){
                return element.parentElement
            }
            element = element.parentElement
        }

    }
    var selectorRule = {}
    function validate(inputElement,rule){        // Hàm hiển thị lỗi
        var errorElement = getParent(inputElement,options.formGroupSelector).querySelector(options.errorSelector);
        var errorMessage;
        // Lấy các rules của selector
        var rules = selectorRule[rule.selector]
        // Lặp qua từng rules và kiểm tra. Nếu có lỗi thì dừng kiểm tra
        for (var i = 0; i< rules.length; i++){
            switch(inputElement.type){
                case 'checkbox':
                case 'radio':
                    errorMessage = rules[i](
                        formElement.querySelector(rule.selector + ':checked')
                    );
                    break;
                default: 
                    errorMessage = rules[i](inputElement.value);
            }
            if (errorMessage) break;
        }
        if (errorMessage) {
            errorElement.innerText = errorMessage
            getParent(inputElement,options.formGroupSelector).classList.add('invalid')
        } else{
            errorElement.innerText = '';
            getParent(inputElement,options.formGroupSelector).classList.remove('invalid');
        }
        return !errorMessage;
    }
    // lấy element của form
    var formElement = document.querySelector(options.form)
    if (formElement){   // lấy form
        // Lắng nghe hành động onsubmit
        formElement.onsubmit = function (e){
            e.preventDefault()      // Loại bỏ hành động mặc định
            var isFormValid = true;     // Trường hợp không có lỗi
            // Lặp qua từng rules và validate các rule
            options.rules.forEach(function(rule){
                var inputElement = formElement.querySelector(rule.selector)
                var isValid = validate(inputElement,rule)
                if (!isValid) {
                    isFormValid = false;
                }
            });
            // console.log(isFormValid)
            if (isFormValid){
                // submit với javascript
                if (typeof options.onSubmit === 'function') {
                    var enableInputs = formElement.querySelectorAll('[name]') 
                    var formValues = Array.from(enableInputs).reduce(function(values, input){
                        switch(input.type){
                            case 'radio':
                                values[input.name] = formElement.querySelector('input[name="'+ input.name +'"]:checked').value
                                break
                            case 'checkbox':
                                if (!input.matches(':checked')) {
                                    values[input.name] = ''
                                    return values
                                }
                                if(!Array.isArray(values[input.name])){
                                    values[input.name] = []
                                }
                                values[input.name].push(input.value)
                                break
                            case 'file':
                                values[input.name]= input.files
                                break
                            default:
                                values[input.name] = input.value
                        }
                        return values         // gán input.value cho object values và return ra values
                        
                    },{});
                    var oldData = JSON.parse(localStorage.getItem("formData")) || [];
                    oldData.push(formValues);
                    localStorage.setItem("formData", JSON.stringify(oldData));
                    // Lưu trên MockAPI
                    fetch('https://6858af13138a18086dfb88d1.mockapi.io/api/v1/users', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(formValues)
                    })
                    .then(response => response.json())
                    .then(data => {
                        console.log('Data successfully sent to MockAPI:', data);
                    })
                    .catch(error => {
                        console.error('Error sending data to MockAPI:', error);
                    });
                    options.onSubmit(formValues)
                } 
                // Submit với hành vi mặc định
                else{
                    // submit với hành động mặc định
                    formElement.submit()
                }
            }
        }
        // Lắng nghe hành động: blur; input...
        options.rules.forEach(function(rule){
            // Lưu lại các rule cho mỗi input
            if (Array.isArray(selectorRule[rule.selector])) {
                selectorRule[rule.selector].push(rule.test)
            } else{
                selectorRule[rule.selector] = [rule.test] 
            }

            var inputElements = formElement.querySelectorAll(rule.selector)
            Array.from(inputElements).forEach(function(inputElement){
                // xử lí trường hợp blur ra ngoài khỏi input
                inputElement.onblur = function(){
                    // lấy value người dùng nhập vào: inputElement.value
                    // test func: rule.test
                    validate(inputElement,rule)
                }
                // Xử lí trường hợp mỗi khi người dùng nhập vào input
                inputElement.oninput = function(){
                    var errorElement = getParent(inputElement,options.formGroupSelector).querySelector(options.errorSelector);
                    errorElement.innerText = '';
                    getParent(inputElement,options.formGroupSelector).classList.remove('invalid');
                }
            })
            
        })
    }
}
// Định nghĩa các rules
// Nguyên tắc của các rule: 
// 1. Khi có lỗi trả messae lỗi
// 2. Hợp lệ: k trả gì cả
Validator.isRequired = function(selector){
    return {
        selector:selector,
        test: function (value) {
            var inputElement = document.querySelector(selector)
            var label = inputElement.id? document.querySelector(`label[for="${inputElement.id}"]`) : null
            var truong = label? label.innerText: 'trường này'
            return value? undefined: `Vui lòng nhập ${truong}`
        }
    }
}
Validator.isEmail = function(selector){
    return {
        selector:selector,
        test: function (value) {
            var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            return regex.test(value)? undefined : 'Vui lòng nhập đúng email'
        }
    }
}
Validator.minLength = function(selector, min){
    return {
        selector:selector,
        test: function (value) {
            return value.length >= min? undefined : `Vui lòng nhập mật khẩu tối thiểu ${min} kí tự`
        }
    }
}
Validator.isConfirmed = function(selector, getconfirmValue, message) {
    return {
        selector:selector,
        test: function (value) {
            return value == getconfirmValue() ? undefined : message || "Giá trị nhập vào không chính xác"
        }
    }
}
