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
### Работа с YAMD
Для сборки библиотеки оформленной в YAMD стиле нужно запустить `python yamd.py path/to/library` - в результате,
в текущем каталоге появится  файл `nameOfTheLibrary.js`. Имя библиотеки задается именем каталога с исходниками,
кроме того, под этим именем библиотека будет добавленна в глобальную область видимости (если, конечно, не указана 
сборка в CommonJS или AMD модуль). 

Имя каталога, а так же имена всех подкаталогов и js-файлов (до ".js") должны быть валидны с точки зрения 
правил для имен переменных в JS.

Иерархия каталогов задает иерархию модулей, а js-файлы наполняют эти модули функциями (конструкторами) - 
получается что-то типа пакетов и классов в Java или пространств имен и классов в C#. 

Для того, чтобы добавить функцию в модуль нужно создать в каталоге соответствующем этому модулю создать 
js-файл (имя файла до .js задает имя функции), определить в нем функцию с любым именем, например `add`, 
и в начале файла вызвать `expose` передав ей функцию, например, `expose(add);`. Весь остальной контент 
файла будет приватным и функция, например `add`, может использовать его как угодно.

Может показаться странным, что функция используется до объявления - `expose(add);`, но это не магия YAMD, а 
легальное поведение для JS - hoisting. Но тем не менее требование к тому, чтобы `expose` шла первой в файле 
является жестким.

Предыдущий пример (математическая библиотека) после сборки примерно эквивалентен следующему коду:
```javascript
var math = (function(){
    var root = {
        add: function(a, b) {
            return a + b;
        },
        multiply: function(a,b) {
            var result = 0;
            for (var i=0;i<a;i++) {
                result = root.add(result, b);
            }
            return result;
        }
    };
    return root;
})();
```

Допустим, мы решили усложнить нашу библиотеку, и добавить в неё распределения из теорвера. Логично их поместить 
в отдельный модуль (каталог), после изменений каталог с исходниками выглядит следующем образом:
```bash
> find .
./math
./math/multiply.js
./math/add.js
./math/distributions
./math/distributions/normal.js
./math/distributions/bernoulli.js
```
Тогда после сборки мы получим примерно следующий код
```javascript
var math = (function(){
    var root = {
        add: function(a, b) {
            return a + b;
        },
        multiply: function(a,b) {
            var result = 0;
            for (var i=0;i<a;i++) {
                result = root.add(result, b);
            }
            return result;
        },
        distributions: {
            normal: function() { 
                throw new Error("TODO");
            },
            bernoulli: function() { 
                throw new Error("TODO");
            }
        }
    };
    return root;
})();
```
### Взаимно рекурсивные модули
### Отложенная инициализация модулей
