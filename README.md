# Using SVG to develop web maps for people with visual disabilities

This repository contains my final degree project, which is focused on researching accessibility for web maps and implementing an accessible geographical map.

The result is a web application which offers two modes: an exploration one, which allows users to get an overview of the zone, and a navigation one, which calculates routes between two points and shows them on the map. On both modes, an accessible version of a web map in presented, along with some features to make it easier to use for users with disabilities.

## Deployment

This project is provided as a Docker container with a default `docker-compose.yaml` file. To deploy, just clone the repository and run:

```
docker-compose up -d
```

If by any means the execution of that command is not successful, you can manually build and run the Docker container:

```
docker build -t map .
docker run --name map -p 8080:8080 -p 8081:8081 -d map
```

You will be able to access the web interface on http://localhost:8080/map and https://localhost:8081/map. Please note that for HTTPS to work, self-generated certificates are provided. Your browser is most likely to report them to you as invalid. HTTPS is necessary when using voice commands, due to browser API limitations.

## Citation
If you find this project useful, please consider citing the following paper:

<blockquote>
Juan-Armero, Sergio & Luján-Mora, Sergio. (2019). Using SVG to develop web maps for people with visual disabilities. Enfoque UTE. 10. 90-106. 10.29019/enfoque.v10n2.467. 
</blockquote>

```
@article{article,
  author = {Juan-Armero, Sergio and Luján-Mora, Sergio},
  year = {2019},
  month = {06},
  pages = {90-106},
  title = {Using SVG to develop web maps for people with visual disabilities},
  volume = {10},
  journal = {Enfoque UTE},
  doi = {10.29019/enfoque.v10n2.467}
}
```