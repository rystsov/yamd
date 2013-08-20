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
файла будет приватным и виден только экспортируемой функции.

Может показаться странным, что функция используется до объявления - `expose(add);`, но это не магия YAMD, а 
легальное поведение для JS - hoisting. Но тем не менее требование к тому, чтобы `expose` шла первой в файле и 
встречалась только один раз является жестким.

Предыдущий пример (математическая библиотека) после сборки будет примерно эквивалентен следующему коду:
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

Вернемся к `expose`, помимо функции, она конечно же может экспортировать в модуль строки, числа или объекты. 
Получается, что мы можем переписать предыдуший пример, поместив все распределения в один файл в 
корне библиотеки, а не создавая отдельный каталог:
```javascript
// FILE ./math/distributions.js
expose({normal: normal, bernoulli: bernoulli});
function normal() { 
    throw new Error("TODO");
},
function bernoulli() { 
    throw new Error("TODO");
}
```
После сборки библотеки будут полностью эквивалентны.
### Взаимно рекурсивные модули
В YAMD возможно добавить в модуль функцию, которая использует функцию другого модуля, а та первую. 
Впрочем в случае CommonJS и AMD это тоже возможно, разница только в кол-ве кода. Для примера напишем функцию,
вычисляющую кол-во шагов в 
[процессе Коллатца](http://ru.wikipedia.org/wiki/%D0%93%D0%B8%D0%BF%D0%BE%D1%82%D0%B5%D0%B7%D0%B0_%D0%9A%D0%BE%D0%BB%D0%BB%D0%B0%D1%82%D1%86%D0%B0). 
Как и в предыдушем примере структура каталога не будет меняться в случае AMD, CommonJS и YAMD:
```bash
> find math/collatz
math/collatz
math/collatz/steps.js
math/collatz/inc.js
math/collatz/dec.js
```
Начнем с **AMD** и опишем рекурсивные зависимости. Согласно 
[этому документу](http://requirejs.org/docs/api.html#circular) нам пришлось добавить зависимость от require и 
использовать её для явного импорта зависимостей внутри функций.
```javascript
// FILE ./math/collatz/steps.js
define(["require", "math/collatz/inc", "math/collatz/dec"],
    function(require, inc, dec) {
        return function(n) {
            if (n==1) return 0;
            if (n%2==0) return require("math/collatz/dec")(n);
            if (n%2==1) return require("math/collatz/inc")(n);
        };
    }
);

// FILE ./math/collatz/inc.js
define(["require", "math/collatz/steps"],
    function(require, steps) {
        return function(n) {
            return require("math/collatz/steps")(3*n+1)+1;
        };
    }
);

// FILE ./math/collatz/dec.js
define(["require", "math/collatz/steps"],
    function(require, steps) {
        return function(n) {
            return require("math/collatz/steps")(n/2)+1;
        };
    }
);
```
Рассмотрим тот же пример в **CommonJS** - код очень похож на обычный CommonJS, за одним исключением: 
нам пришлось поместить вызов require внутрь функций.
```javascript
// FILE ./math/collatz/steps.js
function steps(n) {
    if (n==1) return 0;
    if (n%2==0) return require('./dec')(n);
    if (n%2==1) return require('./inc')(n);
}
module.exports = steps;

// FILE ./math/collatz/inc.js
function inc(n) {
    return require('./steps')(3*n+1)+1;
}
module.exports = inc;

// FILE ./math/collatz/dec.js
function dec(n) {
    return require('./steps')(n/2)+1;
}
module.exports = dec;
```
Преимущетво в случае с **YAMD** состоит в том, что код рекурсивными зависимостями ничем не отличается от обычного.
```javascript
// FILE ./math/collatz/steps.js
expose(steps);
function steps(n) {
    if (n==1) return 0;
    if (n%2==0) return root.collatz.dec(n);
    if (n%2==1) return root.collatz.inc(n);
}

// FILE ./math/collatz/inc.js
expose(inc)
function inc(n) {
    return root.collatz.steps(3*n+1)+1;
}

// FILE ./math/collatz/dec.js
expose(dec)
function dec(n) {
    return root.collatz.steps(n/2)+1;
}
```
С этим примером справились все три подхода, но он относительно простой - рекурсивная природа вылезает только при 
пользовательском вызове функций библотеки, а к этому времени библотека уже загружена. Проблема с взаимной
рекурсией возникает, если при инициализации библотеки нужно использовать функции самой библиотеки. 
Эта проблема хорошо разобрана в [сообщении](https://groups.google.com/forum/#!topic/commonjs/b9hbk0QgVGQ) Тома.

Для борьбы с ней в YAMD была добавлена отложенная инициализация: в `expose` вторым аргументом можно передать 
функцию (конструктор модуля), для которой гарантируется, что она будет вызвана после того, как все модули 
загрузятся.

Для примера вернемся к нашему примеру, мы решили ускорить работу `steps` и для некоторых `n` вычислить число шагов 
при загрузке библоитеки. Пусть у нас определен декоратор
```javascript
function tableLookup(table, f) {
    return function(n) {
        if (n in table) return table[n];
        return f(n);
    }
}
```
Тогда нам достаточно изменить файл steps.js в YAMD подходе следующем образом
```javascript
// FILE ./math/collatz/steps.js
expose(tableLookup(table, steps), ctor);
var table = {};
function ctor() {
    table[3] = steps(3);
}
function steps(n) {
    if (n==1) return 0;
    if (n%2==0) return root.collatz.dec(n);
    if (n%2==1) return root.collatz.inc(n);
}
```
При использовании CommonJS у нас есть два способа реализовать тоже самое:
  * добавить в библиотеку явной метод инициализации
  * отложить инициализацию table до первого вызова
Получается плохо - в CommonJS для решения этой задачи мы должны либо поменять API, либо нарушить 
single responsibility principle и добавить в steps контроль ленивости:
```javascript
// FILE ./math/collatz/steps.js
var table = {};
var inited = false;
function ctor() {
    table[3] = steps(3);
}
function steps(n) {
    if (!inited) {
        ctor();
        inited = true
    }
    if (n==1) return 0;
    if (n%2==0) return require('./dec')(n);
    if (n%2==1) return require('./inc')(n);
}
module.exports = tableLookup(table, steps)
```
Если закрыть глаза на нарушение SRP в CommonJS и рассматривать тяжелые процессы инициализации, то оба варианта 
плохи тормозами, в случае YAMD, тормозами при подключении библиотеки, а в случае CommonJS, тормозами при первом 
вызове `steps`. Но инициализация не всегда тяжелая, а если она все таки такая, то используя YAMD можно попытаться 
её вынести в процессы WebWorker'ов запускаемых из ctor и надеятся, что к первому запуску `steps` она уже закончится.
Использовать CommonJS так же мы не можем, так как шанс запустить инициализацию у нас получится только при первом 
запросы, следовательно этот запрос не успеет предсчитаться и гарантированно будет подтормаживать.
