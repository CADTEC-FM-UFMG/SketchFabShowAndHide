## Bem-vindo ao SketchFabShowAndHide

## Visualizador personalizado para Sketchfab utilizando a API Viewer para permitir mostrar e ocultar as partes do modelo. Código desenvolvido originalmente por: FullyCroisened

Exemplo em execução aqui: https://cadtec-fm-ufmg.github.io/SketchFabShowAndHide/?id=8023c523cc224c3cbd007f55b439e254


Para usar este projeto você só precisa de 3 arquivos...

- index.html (este arquivo contém apenas o andaime HTML para abrigar o visualizador da API Sketchfab)
- style.css (este arquivo contém as informações de layout baseadas em bootstrap)
- sf_showhide.js (Este arquivo contém todo o código para inicializar o visualizador Sketchfab, processar todas as Matrix Transforms e finalmente gerar o treeview com botões mostrar e ocultar para cada objeto na cena)

No arquivo javascript há uma variável "id" que você pode alterar para qualquer modelo no Sketchfab com base no guia desse modelo que você pode ver na URL de qualquer modelo. Isso atua como modelo padrão para carregar caso não haja uma variável "id" definida na string de consulta da página HTML, então você pode simplesmente alterá-la para visualizar qualquer modelo que escolher.

Siga no Twitter @FullyCroisened
