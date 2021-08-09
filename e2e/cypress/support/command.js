// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This is will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })
function verify_element_exists() {

    /* for (let i = 0; i < 5; i++) {

        if(tdText == 'Finishe') {
            cy.wrap(tdText).should('eq', 'Finished');
            break;
        }
        
        cy.wait(30000);
        cy.reload(true);
        tdText = cy.get('td').eq(4).then(($td) => {

            cy.log(`tdText1=${$td.text()}`);
            let textCont = $td.text()
             if(textCont != 'Running') {
                textCont.should('eq', 'Finished');
            } 
            return textCont
        });
    } */
    cy.get('td').eq(4).then(($td) => {
        if ($td.text() == 'Finished') {
            cy.wrap($td.text()).should('eq', 'Finished');
        } else {
            cy.wait(10000);
            cy.reload(true);
            verify_element_exists();
        }  
    })
}

Cypress.on('uncaught:exception', (err, runnable) => {
    // returning false here prevents Cypress from
    // failing the test
    return false
})

Cypress.Commands.add('login', (userName, password, loginTest) => {
    /**
     * Method to fill and submit the CKAN Login form
     * :PARAM userName String: user name of that will be attempting to login
     * :PARAM password String: password for the user logging in
     * :RETURN null:
     */
    if (!loginTest) {
        cy.visit('/user/login')
    }
    cy.get('#field-login').type(userName)
    cy.get('#field-password').type(password)
    cy.get('.btn-primary').click()
})

Cypress.Commands.add('create_organization_ui', (orgName, orgDesc) => {
    /**
     * Method to fill out the form to create a CKAN organization
     * :PARAM orgName String: Name of the organization being created
     * :PARAM orgDesc String: Description of the organization being created
     * :PARAM orgTest Boolean: Control value to determine if to use UI to create organization 
     *      for testing or to visit the organization creation page
     * :RETURN null:
     */
    cy.get('#field-name').type(orgName)
    cy.get('#field-description').type(orgDesc)
    cy.get('#field-url').then($field_url => {
        if($field_url.is(':visible')) {
            $field_url.type(orgName)
        }
    })
    //cy.get('input[type="file"]').attachFile(cy.fixture('org_photo.jpg'))
    cy.screenshot()
    cy.get('button[name=save]').click()
})

Cypress.Commands.add('create_organization', (orgName, orgDesc) => {
    /**
     * Method to create organization via CKAN API
     * :PARAM orgName String: Name of the organization being created
     * :PARAM orgDesc String: Description of the organization being created
     * :PARAM orgTest Boolean: Control value to determine if to use UI to create organization 
     *      for testing or to visit the organization creation page
     * :RETURN null:
     */

     cy.request({
        url: '/api/action/organization_create',
        method: 'POST',
        body: {
            "description": orgDesc,
            "title": orgName,
            "approval_status": "approved",
            "state": "active",
            "name": orgName
        }
    })
})


Cypress.Commands.add('delete_organization', (orgName) => {
    /**
     * Method to purge an organization from the current state
     * :PARAM orgName String: Name of the organization to purge from the current state
     * :RETURN null:
     */
     cy.request({
        url: '/api/action/organization_delete',
        method: 'POST',
        failOnStatusCode: false,
        body: {
            "id": orgName
        }
    })
    cy.request({
        url: '/api/action/organization_purge',
        method: 'POST',
        failOnStatusCode: false,
        body: {
            "id": orgName
        }
    })
})

Cypress.Commands.add('delete_dataset', (datasetName) => {
    /**
     * Method to purge a dataset from the current state
     * :PARAM datasetName String: Name of the dataset to purge from the current state
     * :RETURN null:
     */
     cy.request({
        url: '/api/action/dataset_purge',
        method: 'POST',
        failOnStatusCode: false,
        body: {
            "id": datasetName
        }
    })
})


Cypress.Commands.add('create_harvest_source', (dataSourceUrl, harvestTitle, harvestDesc, harvestType, org, harvestTest, invalidTest) => {
    /**
     * Method to create a new CKAN harvest source via the CKAN harvest form
     * :PARAM dataSourceUrl String: URL to source the data that will be harvested
     * :PARAM harvestTitle String: Title of the organization's harvest
     * :PARAM harvestDesc String: Description of the harvest being created
     * :PARAM harvestType String: Harvest source type. Ex: waf, datajson
     * :PARAM org String: Organization that is creating the harvest source
     * :PARAM harvestTest Boolean: Determines if to use UI in harvest source creation test or to follow the UI to create a source
     * :RETURN null:
     */
    if (!harvestTest) {
        cy.visit('/harvest/new')
    }
    if (!invalidTest) {
        cy.get('#field-url').type(dataSourceUrl)
    }
    cy.get('#field-title').type(harvestTitle)
    cy.get('#field-name').then($field_name => {
        if($field_name.is(':visible')) {
            $field_name.type(harvestTitle)
        }
    })

    cy.get('#field-notes').type(harvestDesc)
    cy.get('[type="radio"]').check(harvestType)
    if(harvestType == 'waf'){
        //cy.get('#text').then($text => {
        //    if($text.val() == 'Validation'){
        //        
        //    }
        //})
        cy.get('[type="radio"]').check('iso19139ngdc')
    }

    // Set harvest to be public always, per best practices
    cy.get('#field-private_datasets').select('False')
    
    cy.get('input[name=save]').click()
})


Cypress.Commands.add('delete_harvest_source', (harvestName) => {
    cy.visit('/harvest/admin/' + harvestName)
    cy.contains('Clear').click({force:true})
    cy.visit('/harvest/delete/'+harvestName+'?clear=True')
    
})


Cypress.Commands.add('start_harvest_job', (harvestName) => {
    cy.visit('/harvest/' + harvestName)
    cy.contains('Admin').click()
    cy.get('.btn-group>.btn:first-child:not(:last-child):not(.dropdown-toggle)').click({force:true})
    verify_element_exists();
    //cy.wait(150000)
    //cy.reload(true)
    //cy.contains('0 not modified').should('have.class', 'label')
    //cy.get('td').should('contain', 'Finished')
})


Cypress.Commands.add('create_dataset', (ckan_dataset) => {
    var options = {
        'method': 'POST',
        'url': '/api/3/action/package_create',
        'headers': {
            'cache-control': 'no-cache',
            'content-type': 'application/json'
        },
        body: JSON.stringify(ckan_dataset)
    };

    return cy.request(options)
})


// Performs an XMLHttpRequest instead of a cy.request (able to send data as FormData - multipart/form-data)
Cypress.Commands.add('form_request', (method, url, formData, done) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.onload = function () {
        done(xhr);
    };
    xhr.onerror = function () {
        done(xhr);
    };
    xhr.send(formData);
})