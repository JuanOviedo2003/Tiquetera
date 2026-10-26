 cd ~/projects/electivaVNocturno/equipo-1/Tiquetera
            git fetch origin
            git checkout develop
            git pull origin develop
            docker compose down
            docker compose up --build -d
            exit
