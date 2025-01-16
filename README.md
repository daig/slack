gotta go fast

# deploy

`npm run build`
`scp -r dist ubuntu@0.0.0.0:~/slack/landing-page`
`scp ./.env ubuntu@0.0.0.0:~/slack`
`ssh ubuntu@0.0.0.0`
`sudo docker compose build`
`sudo docker compose up -d`
