# YAMD

Еще один подход для определения модулей для JavaScript. В отличие от CommonJS и AMD:
  * позволяет писать меньше обвязок (boilerplate code)
  * хорошо поддерживает взаимно рекурсивные модули
  * повторяет (насколько это возможно) модульность Java/C#
  * создан для создания библиотек, а не компоновки приложений
  * определение модулей отделено от их инициализации

YAMD - подход к организации исходников библиотеки, состоящих из нескольких файлов, и 
скрипт для генерации выходного одного файла. Файл на выходе может быть как чистый js,
вводящий в глобальную область видимости одно имя (название библиотеки), так и библиотека
в CommonJS или AMD обертке.

Использование YAMD при разработке библиотеки не накладывает ограничений или обязательств на 
пользователя библиотеки.

Применять YAMD имеет смысл когда: 
  * вы создаете относительно сложную библоитеку
  * у библиотеки нет внешних зависимостей
  * вы не хотите ограничивать потребителя вашим подходом к модульности

### Сравнение YAMD, AMD и CommonJS
Сравним на простом примере YAMD, AMD и CommonJS. Представим, что мы пишем математическую 
библиотеку. Выделим функции библиотеки в отдельные файлы, таким образом, каталог с 
исходниками для всех подходов будет одинаков:
```bash
> find .
./math
./math/multiply.js
./math/add.js
```

Рассмотрим **AMD** подход.
```javascript
// FILE ./math/add.js
define([], function() {
    return function(a,b) {
        return a + b;
    };
});

// FILE ./math/multiply.js
define(["math/adding"], function(adding) {
    return function(a,b) {
        var result = 0;
        for (var i=0;i<a;i++) {
            result = adding(result, b);
        }
        return result;
    };
});

// USAGE (assuming all dependencies are included)
require(["math/add", "math/multiply"], function(add, multiply) {
    console.info(add(2,7));
    console.info(multiply(2,7));
});
```

**CommonJS** уменьшает кол-во обвязок по сравнению с AMD за счет неявного оборачивания 
каждого файла в функцию.
```javascript
// FILE ./math/add.js
function add(a, b) {
    return a + b;
}
module.exports = add;

// FILE ./math/multiply.js
var add = require('./add');
function multiply(a,b) {
    var result = 0;
    for (var i=0;i<a;i++) {
        result = add(result, b);
    }
    return result;
}
module.exports = multiply;

// USAGE (assuming all dependencies are included)
var multiply = require("./math/multiply");
var add = require("./math/add");
console.info(add(7,2));
console.info(multiply(7,2));
```

**YAMD** делает шаг вперед по сравнению с CommonJS - вводит корень библотеки, через который можно 
обращаться к любой её части без явного импорта.
```javascript
// FILE ./math/add.js
expose(add);
function add(a, b) {
    return a + b;
}

// FILE ./math/multiply.js
expose(multiply);
function multiply(a,b) {
    var result = 0;
    for (var i=0;i<a;i++) {
        result = root.add(result, b);
    }
    return result;
}

// USAGE (assuming all dependencies are included)
console.info(math.add(7,2));
console.info(math.multiply(7,2));
```
### Соглашения
Для того, чтобы работать с YAMD нужно запомнить несколько соглашений.

Все исходники библиотеки должны находиться в одном каталоге (иерархия допустима), имя каталога 
должно совпадать с именем библиотеки; именно это имя появится в глобальной области видимости при 
сборке исходника в один файл (если, конечно, не указана сборка в CommonJS или AMD модуль).

Иерархия каталогов задает иерархию модулей, а js файлы наполняют эти модули содержимом.


### Взаимно рекурсивные модули
### Отложенная инициализация модулей
