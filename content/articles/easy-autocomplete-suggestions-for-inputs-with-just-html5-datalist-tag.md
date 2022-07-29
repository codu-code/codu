---
title: 🔎 Easy Autocomplete / Suggestions for Inputs with just HTML5 | datalist tag
published: true
user_id: nialljoemaher
description: Sometimes you would like to suggest some options to a user as they type something into an input. Maybe there are popular search categories or tags that people are looking for. You could, of course, implement an API driven feature, or if you want to get a quick way for it to be up and running why not just use the datalist tag?
tags: beginners, codenewbie, html, webdev
cover_image: https://media.giphy.com/media/72vhYQZVjvTjNOCH7u/giphy.gif
read_time: 2 min
date: "2021-01-12"
---


Sometimes you would like to suggest some options to a user as they type something into an input. Maybe there are popular search categories or tags that people are looking for. You could, of course, implement an API driven feature, or if you want to get a quick way for it to be up and running why not just use the `datalist` tag?

---

> The HTML `<datalist>` element contains a set of `<option>` elements that represent the permissible or recommended options available to choose from within other controls. — MDN

Datalist acts as a hybrid between a normal input and a select field where it allows users to either choose a suggested option, see suggestions as you type, or add in their own option.

So how does it work?

Let’s show you how to add the `datalist` tag to a regular old `<input type="text">` as a simple example (and probably the most common one you will use).
`datalist` will work nearly identically to a select tag taking inner options.

```html
<input type="text" id="programming_language" list="languages"/>
<datalist id="languages">
 <option value="JavaScript"></option>
 <option value="Python"></option>
 <option value="Java"></option>
 <option value="HTML">Stop being a troll</option>
</datalist>
``` 

The important thing you will see here is that our input takes a list as an option that directs to the id of the `datalist` you want to use to populate the input.


![Looking at datalist in action.](https://media.giphy.com/media/1Mr3zQeIbj3sD1iVaR/giphy.gif)

You can also add in some inner notes so in this example you will see if someone starts typing “Html” as their favorite programming language, we can show a little note telling them to stop trolling us…

The other really cool thing about `datalist` is that it isn’t just strictly for inputs with a type of text. You can use it to add some suggestions to pretty much any tags including date and color tags.

Here’s an example of it in use with a color picker:

```html
<label for="pick_color">Pick a color</label>
<input type="color" id="pick_color" list="colors"/>
<datalist id="colors">
 <option value="#155AF0"></option>
 <option value="#F107BA"></option>
 <option value="#2B2B2B"></option>
</datalist>
```

![Looking at a datalist being used for input using a type of color](https://media.giphy.com/media/leAjwjKSyE9SigQbYy/giphy.gif)

I’m a big fan of learning by hacking so jump straight into [this CodePen](https://codepen.io/codu/pen/mdrxrBw) to try it out for yourself.


Example of the datalist tags in action
When to use this? Since this will add DOM elements, I would suggest using this when you don’t have a whole database worth of suggestions (maybe less than 50 or so is a good rule of thumb for me).

Until the next one, happy coding! ❤

---

Follow me on  [Twitter](https://twitter.com/nialljoemaher) 

Subscribe on  [Codú Community](https://www.youtube.com/channel/UCvI5azOD4eDumpshr00EfIw) 
