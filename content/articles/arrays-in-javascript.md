---
title: Arrays In JavaScript For Beginners
published: true
user_id: pkspyder007
description: Consider a case when you want to store lots of data e.g. all your favorite pizzas or tacos. How will you store all the names in your program? Will you create 10 different variables for ten different pizzas?.
tags: beginners, codenewbie, html, webdev, javascript, arrays
read_time: 3 min
date: "2022-08-08"
---

## After reading this article you'll be confident using arrays in JavaScript 

## Need ??
Consider a case when you want to store lots of data e.g. all your favorite pizzas or tacos. How will you store all the names in your program?

Will you create 10 different variables for ten different pizzas? That would be a mess to deal with, So an **ARRAY** help us to **group items** together in memory/program under a common name. In simple English say list of pizzas.

## So how to use an array?

Let's create an array that will hold the name of our friends we want to invite to our party say, John, Rohan, Mike, Lynda.  It looks something like this in js.

```js
let friends = [ 'John', 'Rohan', 'Mike', 'Lynda' ]
```

The syntax for an array is that it has ```, ``` separated values inside ``` [  ] ``` square brackets. The values inside it could be of any datatype ``` Number, Boolean, String, Objects, Arrays, etc ```.

Now we have created an array and we want to access an element from it, how can we do so?? The answer is using **indices**, every element in an array is associated with an index that is a number, and in javascript, indices start from `0` which means that `John` will have index `0` and `Lynda` will have index `3`.

For accessing an element we just pass the index of the element we want to access within square brackets in the array.

```js
friends[ 0 ]; // This will return John
friends[ 1 ]; // This will return Rohan
friends[ 2 ]; // This will return Mike
friends[ 3 ]; // This will return Lynda
```

The friends variable also has a special property named **`length`** which holds the length of the array. So,
```js
 console.log( friends.length ) // will print 4 in the console
```

We can use this property to iterate over the array using a for-loop.
Here is an example
```js
let pizzas = [ 'Peppy Paneer', 'Mexican Green Wave', 'Deluxe Veggie', 'Veg Extravaganza', 'CHEESE N CORN' ];

for (let index = 0; index < pizzas.length; index++) {
    console.log( pizzas[ index ] );
}
/*  this will print all the name */
```

We can also use the ` while loop, for-of loop, etc.` to iterate over the array. 
Similarly for changing a value in an array we use the following syntax

```js
let pizzas = [ 'Peppy Paneer', 'Mexican Green Wave', 'Deluxe Veggie', ];
pizzas[0] = "delicious pizza";
```

So now you have a good understanding of array let us see some array methods that javascript provides us with.

```js
let friends = [ 'John', 'Rohan', 'Mike', 'Lynda' ];

friends.push('The Rock'); /* add The Rock to the end of the array */

friends.pop(); /* removes and returns the last element from the array */

friends.join('*'); /* Joins and return all the element into a string with the provided character */

friends.shift(); /* Removes and returns first element from the array and shifts all the remaining element to a lower index */

friends.unshift('Jake');  /* Adds Jake to the beginning of the array and shifts other elements to a higher index */
```

There are lots of such methods already given by javascript you can check them out at  [W3Schools](https://www.w3schools.com/js/js_array_methods.asp) or  [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array#).
Before we wrap up let us see some more example of arrays

```js
let multiDimensionalArray = [ [1, 2, 3], [4, 5, 6], [7, 8, 9] ];
/* As mentioned in the begining arrays can hold any datatype */

let arrayOfObjects = [ 
    { name: 'John', phone: 123654789 },
    { name: 'Lynda', phone: 98756321 },
    { name: 'Rohan', phone: 8852369741 },
 ];

let arrayOfEveryThing = [
    1,
    "Hello World!!!",
    true,
    [ true, false, true, 1, "10" ],
    { name: "John Doe",  age: 25, address: "some address"},
    Date.now(),
]
```

Well, that's all the basic you need 🎉🎉. In upcoming articles we will see some advanced behavior of our array in JavaScript and how we can use modern syntax to manipulate them.