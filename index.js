const vorpal = require('vorpal')();
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

vorpal
  .command('new')
  .option('-t, --tags <tags>','Tags are seperated with commas')
  .action(function(args, callback){
    inquirer.prompt(
      {
        type: 'list',
        name: 'mainMenu',
        message: 'Main Menu',
        choices: [
          'New Note',
          'View Notes'
        ]
      }
    ).then((answers)=>{
      if(answers.mainMenu === "New Note"){
        var question = {
          type: 'input',
          name: 'note_text',
          message: 'Note'
        }
        inquirer.prompt(question).then((answers) => {
          var params = {
            write_key: config.bucket.write_key,
            type_slug: 'notes',
            title: Random.id().toLowerCase(),
            content: answers.note_text
          }
          Cosmic.addObject(config, params, (error, response) =>{
            if(error){
              console.log(error)
            }
          })
        })
      } else {
        var params = {
          type_slug: 'notes',
          limit: 10,
          skip: 0
        };
        
        Cosmic.getObjectType(config, params, (error, response)=>{
          var notes = []
          var noteText = []
          const amount = response.objects.all.length
          console.log(amount)
          response.objects.all.map((note)=>{
            var newnote = {
              name: note.content,
              slug: note.slug
            }
            noteText.push(chalk.red('slug - '+note.slug + ' | ') + chalk.blue(note.content))
            notes.push(newnote)
            if(notes.length === amount){
              inquirer.prompt(
                {
                  type: 'list',
                  name: 'allnotes',
                  message: 'All Notes:',
                  choices: noteText
                }
              ).then((answers)=>{
                var regexSearch = /(\w{17})/
                var newvalue = answers.allnotes.match(regexSearch)
                Cosmic.getObject(config, {slug: newvalue[0]}, (error, response)=>{
                  inquirer.prompt({
                    type: 'expand',
                    message: chalk.blue(response.object.content),
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
                    ]
                  }).then((answers)=>{
                    if(answers.morecontext === 'edit'){
                      inquirer.prompt(
                        {
                          type: 'input',
                          name: 'newText',
                          message: 'New Text:'
                        }).then((answers)=>{
                          console.log(answers.newText)
                          var params = {
                            write_key: config.bucket.write_key,
                            slug: response.object.title,
                            type_slug: 'notes',
                            title: response.object.title,
                            content: answers.newText
                          }
                          Cosmic.editObject(config, params, (error, response)=>{
                            if(error){
                              console.log(error)
                            }
                          })
                        })
                    } else {
                      var params = {
                        write_key: config.bucket.write_key,
                        slug: response.object.title
                      }
                      Cosmic.deleteObject(config, params, (error, response)=>{
                        if(error){
                          console.log(error)
                        }
                      })
                    }
                  })
                })
              })
            }
          })
        })
      }
    })
  })
  
vorpal
  .delimiter(chalk.yellow('~ notes$'))
  .show();