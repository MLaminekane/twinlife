import test from 'node:test'
import assert from 'node:assert/strict'
import { fallbackDirectiveRules } from '../src/fallbackDirectives.js'
import { DirectiveSchema } from '../src/schemas.js'

test('all command centre suggestions work in local mode', () => {
  assert.deepEqual(fallbackDirectiveRules('Ajoute Léa comme étudiante à la bibliothèque').peopleAdd, [{ count: 1, name: 'Léa', role: 'student', to: 'bibliothèque', workplace: 'bibliothèque' }])
  assert.equal(fallbackDirectiveRules('Ajoute un bâtiment nommé Atelier').buildingAdd?.[0].name, 'Atelier')
  assert.deepEqual(fallbackDirectiveRules('Augmente l’activité de la bibliothèque').buildingActivityChanges, [{ buildingName: 'bibliothèque', activityDelta: 0.2 }])
  assert.equal(fallbackDirectiveRules('Passe en soirée').environment?.dayPeriod, 'soir')
})

test('preserves names, distinct counts, roles and downtown destinations', () => {
  assert.equal(fallbackDirectiveRules('Ajoute Jean-Pierre comme employé à la banque').peopleAdd?.[0].name, 'Jean-Pierre')
  assert.equal(fallbackDirectiveRules('Ajoute une personne nommée Élodie à la bibliothèque').peopleAdd?.[0].name, 'Élodie')
  assert.equal(fallbackDirectiveRules('Ajoute 25 étudiantes à la bibliothèque').peopleAdd?.[0].count, 25)
  assert.equal(fallbackDirectiveRules('Ajoute un habitant à la banque').peopleAdd?.[0].count, 1)
  assert.equal(fallbackDirectiveRules('Ajoute 900 personnes à la bibliothèque').peopleAdd?.[0].count, 200)
})

test('creates typed buildings with clean names and the requested district', () => {
  assert.deepEqual(fallbackDirectiveRules('Ajoute un café nommé Horizon dans la zone du campus').buildingAdd, [{ name: 'Horizon', type: 'food', zone: 'campus' }])
  assert.deepEqual(fallbackDirectiveRules('Crée un parc nommé « Les Érables » dans la zone résidentielle').buildingAdd, [{ name: 'Les Érables', type: 'park', zone: 'residential' }])
  assert.equal(fallbackDirectiveRules('Ajoute un bâtiment nommé Été').environment, undefined)
})

test('interprets precise times, seasons, weather and percentages', () => {
  assert.equal(fallbackDirectiveRules('Passe à 18h30 en hiver').environment?.gameTime, 18.5)
  assert.equal(fallbackDirectiveRules('Passe à 08:15').environment?.gameTime, 8.25)
  assert.equal(fallbackDirectiveRules('Passe dans l’après-midi').environment?.dayPeriod, 'apresmidi')
  assert.equal(fallbackDirectiveRules('Active la neige').environment?.condition, 'snow')
  assert.equal(fallbackDirectiveRules('Mets la température à -12 °C').environment?.temperature, -12)
  assert.equal(fallbackDirectiveRules('Mets l’activité de la banque à 75 %').buildingActivitySet?.[0].level, 0.75)
  assert.equal(fallbackDirectiveRules('Mets la vitesse à 2,5').global?.speedSet, 2.5)
})

test('orders directional flows by their appearance and respects local grammar', () => {
  assert.deepEqual(fallbackDirectiveRules('Envoie 12 personnes de la banque vers la bibliothèque').personFlows, [{ count: 12, from: 'banque', to: 'bibliothèque' }])
  assert.deepEqual(fallbackDirectiveRules('Envoie 8 personnes vers la bibliothèque').personFlows, [{ count: 8, from: undefined, to: 'bibliothèque' }])
  assert.deepEqual(fallbackDirectiveRules('Mets en pause pendant 2 minutes').effects, [{ type: 'pause', durationSec: 120 }])
  assert.deepEqual(fallbackDirectiveRules('Raconte-moi une histoire'), {})
  assert.deepEqual(fallbackDirectiveRules('La cafétéria a été rénovée'), {})
})

test('generated commands pass the API schema without losing new properties', () => {
  const commands = ['Ajoute Léa comme étudiante à la bibliothèque', 'Ajoute un café nommé Horizon', 'Passe à 18h30 en hiver', 'Active la neige', 'Mets la température à -12 °C']
  for (const command of commands) {
    const directive = fallbackDirectiveRules(command)
    assert.deepEqual(DirectiveSchema.parse(directive), directive)
  }
})
