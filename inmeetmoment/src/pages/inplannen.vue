<script lang="ts" setup>
import Curtains from '@/components/icons/curtains.vue'
import Floor from '@/components/icons/floor.vue'
import Window from '@/components/icons/window.vue'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const currentOptionId = ref(0),
  currentStep = ref(1),
  currentDay = ref<null | Date>(null),
  currentTimeslot = ref('')
const API_BASE = import.meta.env.DEV
  ? 'http://localhost:3000/server/api'
  : 'https://user1demo2-inplandemo-20076547469.development.catalystserverless.eu/server/api'

const address = ref({
  street: '',
  zip: '',
  city: '',
})
const contact = ref({
  name: '',
  email: '',
  phone: '',
})
const franchise = ref(''),
  duration = ref(0)

const inmeetOptions = [
  {
    title: 'Vloeren',
    description: 'Vloeren op maat laten inmeten door een van onze experts',
    icon: Floor,
    id: 1,
  },
  {
    title: 'Raamdecoratie',
    description: 'Raamdecoratie op maat laten inmeten door een van onze experts',
    icon: Curtains,
    id: 2,
  },
  {
    title: 'Zonwering',
    description: 'Zonwering op maat laten inmeten door een van onze experts',
    icon: Window,
    id: 3,
  },
]

const selectedOption = computed(() =>
  inmeetOptions.find((option) => option.id === currentOptionId.value),
)

const possibleDates = ref<
  {
    date: Date
    timeslots: {
      available: boolean
      time: string
    }[]
  }[]
>([])

function selectTimeslot(date: Date, tijdslot: string) {
  currentDay.value = date
  currentTimeslot.value = tijdslot
}
for (let i = 0; i < 7; i++) {
  const date = new Date()
  date.setDate(date.getDate() + i)

  if (date.getDay() === 0 || date.getDay() === 6) continue // Skip weekends
  possibleDates.value.push({
    date,
    timeslots: ['10:00', '12:00', '14:00', '16:00'].map((time) => ({ available: true, time })),
  })
}

function selectOption(id: number) {
  currentOptionId.value = id

  setTimeout(() => {
    currentStep.value = 2
  }, 500)
}

function formatDate(date: Date) {
  return Intl.DateTimeFormat('nl-NL', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}
const loaded = ref(false),
  loadError = ref('')

onMounted(() => {
  fetch(API_BASE + '/booking/' + route.params.id)
    .then((response) => response.json())
    .then((data) => {
      address.value = data.address
      contact.value = data.contact
      franchise.value = data.franchise
      duration.value = data.duration

      if (data.type) {
        const findID = inmeetOptions.find((option) => option.title === data.type)
        currentOptionId.value = findID?.id || 0

        if (findID) {
          currentStep.value = 2
        }
      }
      console.log(data)
      loaded.value = true
    })
    .catch((error) => {
      console.error(error)
      loadError.value = error.message
      loaded.value = true
    })

  fetch(API_BASE + '/availability/' + route.params.id)
    .then((response) => response.json())
    .then((data) => {
      possibleDates.value = data.availableTimeslots.map((slot: any) => ({
        date: new Date(slot.date),
        timeslots: slot.timeslots,
      }))
    })
    .catch((error) => {
      console.error(error)
    })
})

async function createEvent(activateCallback: (step: string | number) => void) {
  await fetch(
    API_BASE +
      '/booking/' +
      route.params.id +
      '/create?' +
      new URLSearchParams({
        date: currentDay.value!.toISOString().split('T')[0]!,
        time: currentTimeslot.value!,
        type: inmeetOptions.find((option) => option.id === currentOptionId.value)?.title || '',
      }).toString(),
    {
      method: 'GET',
    },
  )
  activateCallback(4)
}
</script>

<template>
  <Stepper :value="currentStep" @update:value="currentStep = $event" class="h-full flex flex-col">
    <StepPanels class="grow flex flex-col p-0!">
      <StepPanel v-slot="{ activateCallback }" :value="1" class="flex flex-col grow bg-gray-100!">
        <ProgressSpinner class="m-auto!" v-if="!loaded" />
        <div v-else-if="loadError" class="m-auto">
          <p class="text-red-500 text-center">
            Uw aanvraag kon niet worden verwerkt.<br />
            Mogelijk heeft u uw aanvraag al ingediend of is er een fout opgetreden.
          </p>
        </div>
        <div class="flex flex-col items-center m-auto gap-10" v-else>
          <h1 class="mx-auto text-2xl">Wat wilt u laten inmeten?</h1>
          <div class="flex items-center">
            <div class="mx-auto flex gap-10">
              <div
                class="bg-white hover:border-brand-primary border rounded-lg shadow-lg"
                v-for="option of inmeetOptions"
                @click="selectOption(option.id)"
                :class="{
                  'border-brand-primary/50': currentOptionId === option.id,
                  'border-gray-300': currentOptionId !== option.id,
                }"
              >
                <button
                  class="p-5 cursor-pointer flex flex-col items-center transition-all rounded-lg w-full duration-500"
                  :class="{
                    'bg-[#fa3] text-white': currentOptionId === option.id,
                    'hover:bg-[#fa3]/20': currentOptionId !== option.id,
                  }"
                >
                  <component :is="option.icon" class="text-8xl"></component>
                  <h2 class="my-auto font-bold tracking-wide py-2">
                    {{ option.title }}
                  </h2>
                  <div class="max-w-sm">
                    {{ option.description }}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </StepPanel>
      <StepPanel v-slot="{ activateCallback }" :value="2" class="flex flex-col grow bg-gray-100!">
        <div class="flex flex-col items-center m-auto gap-10">
          <div class="mx-auto flex flex-col items-center">
            <h1 class="text-2xl">Welk moment komt u het beste uit?</h1>
            <h2 class="italic">Geschatte duur: {{ duration }} minuten</h2>
          </div>
          <div class="flex items-center gap-5 flex-col">
            <div class="mx-auto flex border border-gray-300 bg-white rounded-lg">
              <div v-for="(date, i) of possibleDates">
                <div
                  class="p-2 flex flex-col items-center w-full border-b border-gray-300 bg-[#fa3] text-white"
                  :class="{
                    'rounded-tl-lg': i == 0,
                    'rounded-tr-lg': i == possibleDates.length - 1,
                  }"
                >
                  <h2 class="my-auto font-bold py-2 text-center px-2">
                    {{ formatDate(date.date) }}
                  </h2>
                </div>

                <div class="p-4 flex flex-col gap-4">
                  <Button
                    v-for="tijdslot of date.timeslots"
                    class="border px-5 py-2 rounded-lg cursor-pointer"
                    :class="{
                      'cursor-not-allowed!': !tijdslot.available,
                    }"
                    @click="selectTimeslot(date.date, tijdslot.time)"
                    :severity="
                      currentDay == date.date && tijdslot.time == currentTimeslot
                        ? 'primary'
                        : !tijdslot.available
                          ? 'danger'
                          : 'secondary'
                    "
                    :disabled="!tijdslot.available"
                  >
                    {{ tijdslot.time }}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div class="flex gap-5">
            <Button
              label="Vorige stap"
              @click="activateCallback(1)"
              severity="secondary"
              icon="pi pi-arrow-left"
            />
            <Button
              label="Volgende stap"
              @click="activateCallback(3)"
              severity="primary"
              icon="pi pi-arrow-right"
              iconPos="right"
              :disabled="!currentTimeslot"
            >
            </Button>
          </div>
        </div>
      </StepPanel>
      <StepPanel v-slot="{ activateCallback }" :value="3" class="flex flex-col grow bg-gray-100!">
        <div class="m-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-10">
          <div class="text-center">
            <h1 class="mx-auto text-2xl">Controleer uw gegevens en plan de afspraak in</h1>
          </div>

          <div
            class="overflow-hidden rounded-lg border border-gray-50 bg-white shadow-lg flex flex-col"
          >
            <div
              class="flex items-center gap-4 border-b border-gray-50 bg-[#fa3] px-6 py-5 text-white"
            >
              <span class="pi pi-calendar text-2xl" aria-hidden="true"></span>
              <div>
                <p class="text-sm text-white/75">Afspraakmoment</p>
                <p class="mt-1 text-lg font-bold">{{ formatDate(currentDay!) }}</p>
                <p class="text-white/90">Om {{ currentTimeslot }}</p>
              </div>

              <div class="ml-auto font-bold text-lg">
                <p class="text-sm text-white/75">Uw Karwei winkel</p>
                {{ franchise }}
              </div>
            </div>

            <div class="grid gap-8 p-6 sm:grid-cols-2 sm:p-8">
              <section aria-labelledby="address-heading">
                <div class="mb-4 flex items-center gap-3 text-foreground-brand">
                  <span class="pi pi-map-marker text-xl" aria-hidden="true"></span>
                  <h2 id="address-heading" class="font-bold">Adres</h2>
                </div>
                <dl class="space-y-3">
                  <div>
                    <dt class="text-sm text-foreground-secondary">Inmeting</dt>
                    <dd class="font-medium">{{ selectedOption?.title }}</dd>
                  </div>
                  <div>
                    <dt class="text-sm text-foreground-secondary">Straat en huisnummer</dt>
                    <dd class="font-medium">{{ address.street }}</dd>
                  </div>
                  <div>
                    <dt class="text-sm text-foreground-secondary">Postcode en stad</dt>
                    <dd class="font-medium">{{ address.zip }} {{ address.city }}</dd>
                  </div>
                </dl>
              </section>

              <section aria-labelledby="contact-heading">
                <div class="mb-4 flex items-center gap-3 text-foreground-brand">
                  <span class="pi pi-user text-xl" aria-hidden="true"></span>
                  <h2 id="contact-heading" class="font-bold">Contactgegevens</h2>
                </div>
                <dl class="space-y-3">
                  <div>
                    <dt class="text-sm text-foreground-secondary">Naam</dt>
                    <dd class="font-medium">{{ contact.name }}</dd>
                  </div>
                  <div>
                    <dt class="text-sm text-foreground-secondary">E-mail</dt>
                    <dd class="break-words font-medium">{{ contact.email }}</dd>
                  </div>
                  <div>
                    <dt class="text-sm text-foreground-secondary">Telefoon</dt>
                    <dd class="font-medium">{{ contact.phone }}</dd>
                  </div>
                </dl>
              </section>
            </div>
          </div>
          <section class="mx-auto pb-2">
            <div class="flex gap-5">
              <Button
                label="Vorige stap"
                @click="activateCallback(2)"
                severity="secondary"
                icon="pi pi-arrow-left"
              />
              <Button
                label="Afspraak inplannen"
                @click="createEvent(activateCallback)"
                severity="primary"
                icon="pi pi-arrow-right"
                iconPos="right"
                :disabled="!currentTimeslot"
              >
              </Button>
            </div>
          </section>
        </div>
      </StepPanel>
      <StepPanel :value="4" class="flex flex-col grow bg-gray-100!">
        <div
          class="m-auto flex w-full max-w-3xl flex-col items-center gap-8 px-5 py-10 text-center"
        >
          <div class="space-y-3">
            <h1 class="mx-auto text-2xl">
              Bedankt, {{ contact.name }}. We hebben uw afspraak voor de inmeting van
              {{ selectedOption?.title.toLowerCase() }} ontvangen.
            </h1>
          </div>

          <div class="grid w-full gap-4 text-left sm:grid-cols-3">
            <div class="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
              <div class="flex gap-2 items-center">
                <span
                  class="pi pi-calendar text-xl text-foreground-brand"
                  aria-hidden="true"
                ></span>
                <p class="text-sm text-brand-primary">Datum</p>
              </div>
              <p class="mt-1 font-semibold">{{ formatDate(currentDay!) }}</p>
            </div>
            <div class="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
              <div class="flex gap-2 items-center">
                <span class="pi pi-clock text-xl text-foreground-brand" aria-hidden="true"></span>
                <p class="text-sm text-brand-primary">Tijd</p>
              </div>
              <p class="mt-1 font-semibold">{{ currentTimeslot }}</p>
            </div>
            <div class="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
              <div class="flex gap-2 items-center">
                <span
                  class="pi pi-envelope text-xl text-foreground-brand"
                  aria-hidden="true"
                ></span>
                <p class="text-sm text-brand-primary">Bevestiging</p>
              </div>
              <p class="mt-1 break-words font-semibold">{{ contact.email }}</p>
            </div>
          </div>
        </div>
      </StepPanel>
    </StepPanels>
  </Stepper>
</template>
