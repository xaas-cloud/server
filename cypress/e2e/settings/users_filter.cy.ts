/**
 * SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { User } from '@nextcloud/cypress'
import { getGroupList, getUserList, getUserListRow } from './usersUtils'

const admin = new User('admin', 'admin')

describe('Settings: Filter in account management', { testIsolation: true }, () => {

	// create state once
	before(() => {
		cy.restoreDB()

		cy.removeUserData(['jane', 'louis'])
		cy.createUser({ language: 'en_US', password: '1234', userId: 'jane' })
		cy.createUser({ language: 'en_US', password: '1234', userId: 'louis' })
		cy.runOccCommand('group:add engineering')
		cy.runOccCommand('group:add sales')
	})

	// only reload the page on every test
	beforeEach(() => {
		cy.login(admin)
		cy.visit('/settings/users')
	})

	it('Can see all groups', () => {
		getGroupList()
			.findAllByRole('listitem')
			.should((elements) => {
				expect(elements).to.have.length(2)
				const entries = elements.get().map((element) => element.textContent?.trim())
				expect(entries).to.have.members(['sales', 'engineering'])
			})
	})

	it('Can filter group list', () => {
		// See all groups
		getGroupList().findAllByRole('listitem').should('have.length', 2)

		// Add a filter
		cy.findByRole('navigation', { name: 'Account management' })
			.findByRole('searchbox')
			.type('engine')

		// See only filtered group
		getGroupList()
			.findAllByRole('listitem')
			.should('have.length', 1)
			.and('contain', 'engineering')
	})

	it('Shows message if no group matches the query', () => {
		// See all groups
		getGroupList().findAllByRole('listitem').should('have.length', 2)

		// Add a filter
		cy.findByRole('navigation', { name: 'Account management' })
			.findByRole('searchbox')
			.type('testing')

		// See that no group is found
		getGroupList()
			.findAllByRole('listitem')
			.should('have.length', 1)
			.and('contain', 'No groups matching')
	})

	it('Can filter the account list', () => {
		// See all accounts
		getUserList()
			.find('[data-cy-user-row]')
			.should('have.length.gte', 3)

		// Add a filter
		cy.findByRole('navigation', { name: 'Account management' })
			.findByRole('searchbox')
			.type('jan')

		// see that only one account matches
		getUserList()
			.find('[data-cy-user-row]')
			.should('have.length', 1)
		getUserListRow('jane')
			.should('exist')
	})

	it('Show message if no account matches', () => {
		// See all accounts
		getUserList()
			.find('[data-cy-user-row]')
			.should('have.length.gte', 3)

		// Add a filter
		cy.findByRole('navigation', { name: 'Account management' })
			.findByRole('searchbox')
			.type('testing')

		// see that no list is shown
		getUserList().should('not.exist')
		cy.get('main').should('contain.text', 'No accounts')
	})

	it('Reset query on navigation', () => {
		// See all accounts
		getUserList()
			.find('[data-cy-user-row]')
			.should('have.length.gte', 3)

		// Add a filter
		cy.findByRole('navigation', { name: 'Account management' })
			.findByRole('searchbox')
			.type('testing')

		// see that no list is shown
		getUserList().should('not.exist')

		// navigate to admins group
		cy.findByRole('navigation', { name: 'Account management' })
			.findByRole('link', { name: /Admins/ })
			.click()

		// see the query is reset
		cy.findByRole('navigation', { name: 'Account management' })
			.findByRole('searchbox')
			.should('have.value', '')

		// the the list is visible again
		getUserList()
			.should('be.visible')
			.find('[data-cy-user-row]')
			.should('have.length.gte', 1)
	})
})
