<!DOCTYPE html>
<html lang="es">
<head>
    <title>Mapa accesible de la Universidad de Alicante</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <meta name="description" content="Página de mantenimiento del mapa accesible de la Universidad de Alicante." />
    <!-- Bootstrap CSS -->
    <link rel="stylesheet" href="/bootstrap/css/bootstrap.min.css" />
    <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.3.1/css/all.css" integrity="sha384-mzrmE5qonljUremFsqc01SB46JvROS7bZs3IO2EmfFsd15uHvIt+Y8vEf7N7fWAU" crossorigin="anonymous">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/dompurify/1.0.8/purify.min.js"></script>

    <style>
        body {
            background-color: #f8f9fa;
        }

        .error-code {
            background-color: #212529;
            color: white;
            font-weight: bold;
            padding: 0.3em 0.3em 0.3em 0.3em;
            border-radius: 0.3em 0.3em 0.3em 0.3em;
        }

        nav {
            box-shadow: 1px 0px 1em gray;
        }
    </style>
</head>
<body>
    <nav class="navbar navbar-light bg-light" id="mainnav">
        <div class="container">
            <a class="navbar-brand mr-auto pl-3" href="/map">Mapa</a>
        </div>
    </nav>

    <main class="container">
        <div class="row">
            <div class="col-12 col-md-4">
                <img src="/images/robot.svg" alt="Ilustración de un robot roto" style="width: 100%;" />
                <small>
                    <a href="https://www.freepik.com/free-vector/hand-drawn-404-error_1587349.htm">Designed by Freepik</a>
                </small>
            </div>

            <div class="col-12 col-md-8 pt-3 pl-3">
                <div class="d-flex flex-row align-items-center" style="height: 100%;">
                    <div class="flex-column align-items-start">
                        <h1>Vaya...</h1>
                        <h2>Parece que ha habido un error</h2>

                        <p class="mt-4">
                            <span class="error-code" title="Código de error" aria-label="Código de error"><?php echo $_REQUEST['code']; ?></span>

                            <span class="error-description">
                                <?php
                                    switch ($_REQUEST['code']) {
                                        case 500:
                                            echo "Error interno del servidor";
                                            break;

                                        case 404:
                                            echo "Recurso no encontrado";
                                            break;

                                        default:
                                    }
                                ?>
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </main>
</body>
</html>
