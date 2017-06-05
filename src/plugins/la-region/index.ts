import { WebPages, Random, Middleware } from '../../utils/folerpa'

const introducciones = [
    'Estas son algunas de las noticias más destacadas de hoy en Ourense',
    'Esto está pasando en Ourense',
    'Los titulares más importantes de hoy en Ourense son',
    'Los titulares de hoy son',
    'La actualidad de Ourense está marcada por'
]

async function getTitulares(limit: number = Infinity) {
    const $ = await WebPages.scrape('http://www.laregion.es/seccion/ourense/')
    
    return  $('h3.title')
                .map((_, titular) => $(titular).text())
                .get()
                .slice(0, limit)
}

export default Middleware.create([
    {
        async run(request) {

            const titulares = await getTitulares(5)

            const titularesStr = titulares.map(titulo => `- ${titulo}\n`).join('')

            const text = `${Random.item(introducciones)}\n${titularesStr}`

            return {
                text,
                type: 1
            }
        }
    }
])