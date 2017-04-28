Today i'm going to show you how  to build a simple note taking app that can be used inside of your command line.
We're going to use CosmicJS which allows us to view these notes from anywhere on any device.

# Setup

In an empty directory start a new npm project.
```sh
npm init
```
Next you'll need to add the following packages.
- cosmicjs ( makes accessing your bucket end points easier )
- meteor-random ( generates a nicely formatted 16 character sequence )
- chalk ( does a good job at coloring the terminal output )
- inquirer ( a framework for the command line )

```sh
npm install --save cosmicjs meteor-random chalk inquirer
```

Now let's take a look at the package.json. If you did everything right so far it should look like this.

```json
{
  "name": "NoteToSelf",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "chalk": "^1.1.3",
    "cosmicjs": "^2.39.0",
    "inquirer": "^3.0.6",
    "meteor-random": "^0.0.3"
  }
}
```
Now let's take a second to setup our index.js file. First thing we need to do is import our packages at the top of the page
 ```js
const chalk = require('chalk');
const inquirer = require('inquirer');
const Random = require('meteor-random');
const Cosmic = require('cosmicjs');
```
When we have done that next we need to setup our buckets information to be used later.

```js
var config = {};
config.bucket = {
  slug: '',
  read_key: '',
  write_key: ''
}
```
You will need to fill in the above object with your buckets information. Now we need to setup the main menu
this is what you'll see when you start the program.

# Code Overview

```js
const MainMenu = () => {
  inquirer.prompt(
    {
      type: 'list',
      name: 'mainMenu',
      message: 'Main Menu',
      choices: [
        'New Note',
        'View Notes',
        new inquirer.Separator(),
        'Exit'
      ]
    }
  ).then((answers)=>{
    if(answers.mainMenu === "New Note"){
      NewNote()
    } else if(answers.mainMenu === "View Notes"){
      ViewNotes()
    } else {
      process.exit()
    }
  })
}
MainMenu()
```
Let's break this down so i'ts easier to understand.
1. generates a cli interface with 3 options
2. after you select an option it runs through a series of if statements directing you to the next interface

Now we are going to create the interface for adding a new note. Buckle in because this is where it gets slightly more confusing.

```js
const NewNote = () => {
  var question = {
    type: 'input',
    name: 'note_text',
    message: 'Note'
  } // 1
  inquirer.prompt(question).then((answers) => { // 2
    var params = {
      write_key: config.bucket.write_key,
      type_slug: 'notes',
      slug: Random.id().toLowerCase(),
      title: answers.note_text,
      content: ''
    } // 3
    if(answers.note_text === ''){
      console.log(chalk.red("You cannot add an empty note"))
      MainMenu()
      return;
    }
    Cosmic.addObject(config, params, (error, response) =>{ // 4
      if(response.object){
        console.log(chalk.green("\u2713" + " Success"))
      }
      if(error){
        console.log(error)
      }
      MainMenu() //5
    })
  })
}
```
This isn't too confusing don't worry we'll walk through it together.
1. we create the question type and declare it to a variable
2. we then send it to a inquirer function to get user input for what the note text should be
3. now we create an object with all the information we'll need for cosmic js. It automatically pulls the input text from inquirer and builds a slug from the meteor random package.
4. we now use the wonder of CosmicJS and create a new object.
5. return to the main menu

The next menu is a little more confusing so we're going to break it down into smaller chunks.

```js
const ViewNotes = () => {
  var params = {
    type_slug: 'notes',
    limit: 10,
    skip: 0
  };
        
  Cosmic.getObjectType(config, params, (error, response)=>{ //fetches all notes
    var notes = []
    var noteText = [chalk.yellow("Return")]
    if(response.total === undefined){
      console.log(chalk.red("No notes found."))
      MainMenu()
      return;
    }
    sortedresponse = response.objects.all.sort((a,b)=>{
      return new Date(b.created) - new Date(a.created)
    })
    const amount = response.objects.all.length
    sortedresponse.map((note)=>{
      var newnote = {
        name: note.title,
        slug: note.slug
      }
      noteText.push(chalk.blue(note.title) + chalk.hidden('slug - '+note.slug + ' | ') )
      notes.push(newnote)
      if(notes.length === amount){
        inquirer.prompt(
          {
            type: 'list',
            name: 'allnotes',
            message: 'All Notes:',
            choices: noteText
          }).then((answers)=>{
            if(answers.allnotes === "\u001b[33mReturn\u001b[39m"){
              MainMenu()
              return;
            }
            var regexSearch = /(\w{17})/
            var newvalue = answers.allnotes.match(regexSearch)
            Cosmic.getObject(config, {slug: newvalue[0]}, (error, response)=>{
              inquirer.prompt({
                type: 'expand',
                message: chalk.blue(response.object.title),
                name: 'morecontext',
                choices: [
                  {
                    key: 'e',
                    name: 'Edit',
                    value: 'edit'
                  },
                  {
                    key: 'd',
                    name: 'Delete',
                    value: 'delete'
                  },
                  {
                    key: 'l',
                    name: 'Leave',
                    value: 'leave'
                  }
                ]}).then((answers)=>{
                  if(answers.morecontext === 'edit'){
                    inquirer.prompt(
                      {
                        type: 'input',
                        name: 'newText',
                        message: 'New Text:'
                      }).then((answers)=>{
                        var params = {
                          write_key: config.bucket.write_key,
                          slug: response.object.slug,
                          type_slug: 'notes',
                          title: answers.newText,
                          content: ''
                        }
                        Cosmic.editObject(config, params, (error, response)=>{
                          if(response.object){
                            console.log(chalk.green("\u2713" + " Success"))
                          }
                          MainMenu()
                        })
                      })
                    
                  } else if(answers.morecontext === 'delete'){
                    var params = {
                      write_key: config.bucket.write_key,
                      slug: response.object.slug
                    }
                    Cosmic.deleteObject(config, params, (error, response)=>{
                      if(error){
                        console.log(error)
                      }
                      if(response.object){
                        console.log(chalk.green("\u2713" + " Success"))
                      }
                      MainMenu();
                    });
                  } else {
                    MainMenu();
                  }
                })
              })
            })
          }
        })
      })
}
```
If this seem like absolutely gibberish that's okay we can take it one piece at a time. Let's start with the top half where we
get all of your notes (up to ten) and display them in a list view.

```js
var params = {
    type_slug: 'notes',
    limit: 10,
    skip: 0
  };
        
  Cosmic.getObjectType(config, params, (error, response)=>{ // 1
    var notes = []
    var noteText = [chalk.yellow("Return")]
    if(response.total === undefined){
      console.log(chalk.red("No notes found."))
      MainMenu()
      return;
    }
    sortedresponse = response.objects.all.sort((a,b)=>{
      return new Date(b.created) - new Date(a.created)
    }) // 2
    const amount = response.objects.all.length
    sortedresponse.map((note)=>{
      var newnote = {
        name: note.title,
        slug: note.slug
      }
      noteText.push(chalk.blue(note.title) + chalk.hidden('slug - '+note.slug + ' | ') ) // 3
      notes.push(newnote)
      if(notes.length === amount){
        inquirer.prompt(
          {
            type: 'list',
            name: 'allnotes',
            message: 'All Notes:',
            choices: noteText
          }).then((answers)=>{
            if(answers.allnotes === "\u001b[33mReturn\u001b[39m"){
              MainMenu()
              return;
            }
            var regexSearch = /(\w{17})/
            var newvalue = answers.allnotes.match(regexSearch) // 4
            Cosmic.getObject(config, {slug: newvalue[0]}, (error, response)=>{ // 5
              inquirer.prompt({ // 6
                type: 'expand',
                message: chalk.blue(response.object.title),
                name: 'morecontext',
                choices: [
                  {
                    key: 'e',
                    name: 'Edit',
                    value: 'edit'
                  },
                  {
                    key: 'd',
                    name: 'Delete',
                    value: 'delete'
                  },
                  {
                    key: 'l',
                    name: 'Leave',
                    value: 'leave'
                  }
                ]})
```
1. We use the CosmicJS package to go ahead and grab all of the objects.
2. We take the array of objects and sort them so the most recent are on the top.
3. We create a string with two seperate parts. The first part is the text of the note styled to be blue using the chalk package. Next we take the slug of the item and pass it in but make it hidden. This is done so that we can fetch more information about this note later on in the program.
4. We take the string the user selected and match it agains a regex search that will find the slug and return it.
5. We get the objects specific information this allows us to use it better later on.
6. We generate the next prompt using the newly fetched data and place the note text in the message field.

That was the basics of fetching the data and manipulating the return in a manner that we can use it correctly in this instance.
Now we're going to take a look at the second half of the view function. This is where we can edit and delete our selected not from before.

```js
]}).then((answers)=>{
    if(answers.morecontext === 'edit'){
      inquirer.prompt(
        {
          type: 'input',
          name: 'newText',
          message: 'New Text:'
        }).then((answers)=>{ // 1
          var params = {
            write_key: config.bucket.write_key,
            slug: response.object.slug,
            type_slug: 'notes',
            title: answers.newText,
            content: ''
          } // 2
          Cosmic.editObject(config, params, (error, response) => { // 3
            if(response.object){
              console.log(chalk.green("\u2713" + " Success"))
            }
            MainMenu()
          })
        })
    } else if(answers.morecontext === 'delete'){
      var params = {
        write_key: config.bucket.write_key,
        slug: response.object.slug
      }
      Cosmic.deleteObject(config, params, (error, response)=>{
        if(error){
          console.log(error)
        }
        if(response.object){
          console.log(chalk.green("\u2713" + " Success"))
        }
        MainMenu();
      });
    } else {
      MainMenu();
    }
  })
```
1. Creates a prompt and asks the user for the new note text
2. Again we build an object with all the neccesarry parts you need.
- we grab the slug from the earlier CosmicJS request
- title is determined by what is typed in the box
- content is left as a blank string on purpose
3. Once we have all the pieces this is where we put them all together and edit what the note says.

# Final Steps

After all of that code it wasn't too bad in the end. After reading that overview you should have a pretty rough idea of what the program is doing. If your still having problems understanding what is going on I'm just an email away.
There are still a few more things that need to be done though. First things first we need to make some adjusts to the package.json file.

```json
{
  "name": "NoteToSelf",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
+  "bin": {
+    "notetoself": "./index.js"
+  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "chalk": "^1.1.3",
    "cosmicjs": "^2.39.0",
    "inquirer": "^3.0.6",
    "meteor-random": "^0.0.3"
  }
}
```
This will make it so that the application is installable system wide and can be called by using 'notetoself'. All that's left to do is install the package to your system.
```sh
npm install -g
```
Once this is done simply run 'notetoself' and you'll have system wide notes available anytime you want.

