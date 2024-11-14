import { registerComponent } from '@very-simple/components'

export default registerComponent('counter', ({ refs }) => {
  const { count, addOne } = refs
  console.log('counter setup')
  addOne?.addEventListener('click', () => {
    count!.innerText = `${+count!.innerText + 1}`
    console.log(`counter ${count!.innerText}`)
  })
})
