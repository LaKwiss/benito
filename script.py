# copy_project_to_desktop.py
import os
import shutil
import platform

# --- Configuration ---
# Nom du dossier à exclure
EXCLUDE_DIR = 'node_modules'
# Ajouter d'autres dossiers/fichiers à exclure si besoin:
# EXCLUDE_PATTERNS = ('node_modules', '.next', '.git', '*.log', '.env*.local')
EXCLUDE_PATTERNS = (EXCLUDE_DIR,)
# --- Fin Configuration ---

def get_desktop_path():
    """Tente de trouver le chemin du Bureau sur différents OS."""
    home = os.path.expanduser('~')
    system = platform.system()

    # Chemins possibles courants
    possible_paths = [
        os.path.join(home, 'Desktop'),      # Anglais (Windows, Linux, macOS)
        os.path.join(home, 'Bureau'),       # Français (Windows, Linux)
        # Ajoute d'autres noms si nécessaire (ex: Schreibtisch pour Allemand)
    ]

    for path in possible_paths:
        if os.path.isdir(path):
            print(f"Chemin du Bureau détecté : {path}")
            return path

    # Si non trouvé, demande à l'utilisateur ou utilise un chemin par défaut
    print("Impossible de détecter automatiquement le chemin du Bureau.")
    print("Utilisation du dossier utilisateur comme base.")
    # Alternative : demander le chemin à l'utilisateur
    # return input("Veuillez entrer le chemin complet vers votre Bureau : ")
    return home # Retourne le dossier home comme fallback

def copy_project():
    """Copie le projet courant vers le Bureau en excluant node_modules."""
    try:
        # 1. Obtenir le dossier source (là où le script est exécuté)
        source_dir = os.getcwd()
        print(f"Dossier source du projet : {source_dir}")

        # 2. Déterminer le nom du projet (nom du dossier courant)
        project_name = os.path.basename(source_dir)
        if not project_name:
            raise ValueError("Impossible de déterminer le nom du projet.")
        print(f"Nom du projet détecté : {project_name}")

        # 3. Déterminer le chemin du Bureau
        desktop_path = get_desktop_path()
        if not desktop_path or not os.path.isdir(desktop_path):
             raise FileNotFoundError(f"Le chemin du Bureau '{desktop_path}' est invalide ou n'a pas été trouvé.")

        # 4. Construire le chemin de destination complet
        destination_dir = os.path.join(desktop_path, project_name)
        print(f"Dossier de destination : {destination_dir}")

        # 5. Vérifier si la destination existe déjà
        if os.path.exists(destination_dir):
            overwrite = input(f"Le dossier '{destination_dir}' existe déjà. Voulez-vous l'écraser ? (o/N) : ").lower()
            if overwrite == 'o':
                print("Suppression du dossier existant...")
                shutil.rmtree(destination_dir)
            else:
                print("Opération annulée.")
                return

        # 6. Copier les fichiers en ignorant les motifs spécifiés
        print(f"Copie de '{source_dir}' vers '{destination_dir}' (exclusion de {EXCLUDE_PATTERNS})...")
        shutil.copytree(
            source_dir,
            destination_dir,
            ignore=shutil.ignore_patterns(*EXCLUDE_PATTERNS),
            dirs_exist_ok=True # Nécessaire si on écrase un dossier existant (après confirmation)
        )

        print("\nCopie terminée avec succès !")
        print(f"Le projet (sans {EXCLUDE_DIR}) se trouve dans : {destination_dir}")

    except FileNotFoundError as e:
        print(f"\nErreur : Fichier ou dossier non trouvé - {e}")
    except PermissionError as e:
        print(f"\nErreur : Problème de permissions - {e}")
    except Exception as e:
        print(f"\nUne erreur inattendue est survenue : {e}")

if __name__ == "__main__":
    copy_project()