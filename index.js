#!/usr/bin/env node
const chalk = require('chalk');
var inquirer = require('inquirer');
const Random = require('meteor-random');


var config = {};
config.bucket = {
  slug: '',
  read_key: '',
  write_key: ''
}
const Cosmic = require('cosmicjs');

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

MainMenu() //Creates the main menu and starts the application

const NewNote = () => {
  var question = {
    type: 'input',
    name: 'note_text',
    message: 'Note'
  }
  inquirer.prompt(question).then((answers) => {
    var params = {
      write_key: config.bucket.write_key,
      type_slug: 'notes',
      slug: Random.id().toLowerCase(),
      title: answers.note_text,
      content: ''
    }
    if(answers.note_text === ''){
      console.log(chalk.red("You cannot add an empty note"))
      MainMenu()
      return;
    }
    Cosmic.addObject(config, params, (error, response) =>{
      if(response.object){
        console.log(chalk.green("\u2713" + " Success"))
      }
      if(error){
        console.log(error)
      }
      MainMenu()
    })
  })
}

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